const db = require("../util/database");
const stripe = require("../util/stripe-payment");

async function createPendingOrder(sessionUserID) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Lock the user so simultaneous checkout attempts are serialized.
    await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [sessionUserID],
    );

    //check for any penting order
    const existingPendingOrder = await client.query(
      `
      SELECT id, stripe_session_id
      FROM orders
      WHERE user_id = $1
        AND status = 'PENDING_PAYMENT'
      LIMIT 1
      `,
      [sessionUserID],
    );

    if (existingPendingOrder.rows.length > 0) {
      const existingOrder = existingPendingOrder.rows[0];

      if (!existingOrder.stripe_session_id) {
        await client.query(
          `
            UPDATE orders
            SET status = 'EXPIRED'
            WHERE id = $1
              AND user_id = $2
    `,
          [existingOrder.id, sessionUserID],
        );
      } else {
        const error = new Error("You already have a pending payment");

        error.statusCode = 409;
        error.order = existingPendingOrder.rows[0];

        throw error;
      }
    }

    //fetch cart
    const cartResult = await client.query(
      `
      SELECT
        cart.id,
        cart.product_id,
        cart.quantity,
        products.title,
        products.price,
        products.imageurl,
        delivery_options.price_dollars,
        delivery_options.delivery_days
      FROM cart
      INNER JOIN products
        ON products.id = cart.product_id
      INNER JOIN delivery_options
        ON delivery_options.id = cart.delivery_options
      WHERE cart.user_id = $1
      FOR UPDATE
      `,
      [sessionUserID],
    );

    if (cartResult.rows.length === 0) {
      const error = new Error("Your cart is empty");
      error.statusCode = 400;
      throw error;
    }

    //insert into order table
    //return order id, user id, creation timestamp
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        user_id,
        status
      )
      VALUES ($1, 'PENDING_PAYMENT')
      RETURNING id, user_id, status, created_at
      `,
      [sessionUserID],
    );

    const order = orderResult.rows[0];

    for (const item of cartResult.rows) {
      const receiveAt =
        Date.now() + Number(item.delivery_days) * 24 * 60 * 60 * 1000;

      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          price,
          date_receive_ms,
          user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          order.id,
          item.product_id,
          item.quantity,
          item.price,
          receiveAt,
          sessionUserID,
        ],
      );
    }

    await client.query("COMMIT");

    return {
      order,
      cart: cartResult.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function attachStripeSession(orderId, userId, stripeSession) {
  const result = await db.query(
    `
    UPDATE orders
    SET stripe_session_id = $1
    WHERE id = $2
    AND user_id = $3
      AND status = 'PENDING_PAYMENT'
    `,
    [stripeSession.id, orderId, userId],
  );

  if (result.rowCount !== 1) {
    throw new Error("Could not attach Stripe Session to order");
  }
}

async function getPendingCheckout(userId) {
  //check pending payment
  const result = await db.query(
    `
    SELECT
      id,
      user_id,
      status,
      stripe_session_id
    FROM orders
    WHERE user_id = $1
      AND status = 'PENDING_PAYMENT'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    const error = new Error("No pending payment found");
    error.statusCode = 404;
    throw error;
  }

  const order = result.rows[0];

  if (!order.stripe_session_id) {
    const error = new Error("The pending order has no Stripe Checkout Session");

    error.statusCode = 409;
    throw error;
  }

  //retrieve the stripeSession
  const stripeSession = await stripe.checkout.sessions.retrieve(
    order.stripe_session_id,
  );

  // Ensure this Stripe Session belongs to this database order.
  if (Number(stripeSession.metadata?.order_id) !== Number(order.id)) {
    throw new Error("Stripe Session does not match pending order");
  }

  if (Number(stripeSession.metadata?.user_id) !== Number(userId)) {
    throw new Error("Stripe Session does not belong to this user");
  }

  return {
    order,
    stripeSession,
  };
}

module.exports = {
  createPendingOrder,
  attachStripeSession,
  getPendingCheckout,
};
