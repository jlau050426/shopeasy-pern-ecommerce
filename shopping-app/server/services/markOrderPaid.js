const db = require("../util/database");

async function markOrderPaid(stripeSession) {
  const orderId = Number(stripeSession.metadata?.order_id);
  const userId = Number(stripeSession.metadata?.user_id);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId],
    );

    if (result.rows.length === 0) {
      throw new Error("Pending order not found");
    }

    const order = result.rows[0];

    // Webhook replay: payment was already processed.
    if (order.status === "PAID") {
      await client.query("COMMIT");
      return;
    }


    //only allow status of PENDING_PAYMENT to process payment
    if (order.status !== "PENDING_PAYMENT") {
      throw new Error(
        `Invalid order status: ${order.status}`,
      );
    }

    if (
      order.stripe_session_id !== stripeSession.id
    ) {
      throw new Error("Stripe Session does not match order");
    }

    //only allow payment if stripe payment status is "paid"
    if (stripeSession.payment_status !== "paid") {
      throw new Error("Stripe Session is not paid");
    }

    await client.query(
      `
      UPDATE orders
      SET status = 'PAID'
      WHERE id = $1
      `,
      [orderId],
    );

    // Safe because cart modifications were blocked while pending.
    await client.query(
      `
      DELETE FROM cart
      WHERE user_id = $1
      `,
      [userId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  markOrderPaid,
};