// REMINDER: STRIPE WILL KEEP ON RETRY WHEN RESPONSE IS NOT 2XX. So Tell Stripe to Stop retrying

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
      const error = new Error("Pending order not found");
      error.isPermanent = true; // retrying will never make the order appear
      throw error;
    }

    const order = result.rows[0];

    // Webhook replay: payment was already processed.
    if (order.status === "PAID") {
      await client.query("COMMIT");
      return;
    }

    //only allow status of PENDING_PAYMENT to process payment
    if (order.status !== "PENDING_PAYMENT") {
      const error = new Error(`Invalid order status: ${order.status}`);
      error.isPermanent = true; //orders never go back to pending payment
      throw error;
    }

    if (order.stripe_session_id !== stripeSession.id) {
      const error = new Error("Stripe Session does not match order");
      error.isPermanent = true; // the order's session will not change
      throw error
    }

    //only allow payment if stripe payment status is "paid"
    if (stripeSession.payment_status !== "paid") {
      const error = new Error("Stripe Session is not paid");
      error.isPermanent = true; // the same event will always say unpaid
      throw error
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
