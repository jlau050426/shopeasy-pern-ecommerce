const db = require("../util/database")

async function markOrderExpired(stripeSession) {
  await db.query(
    `
    UPDATE orders
    SET status = 'EXPIRED'
    WHERE id = $1
      AND stripe_session_id = $2
      AND status = 'PENDING_PAYMENT'
    `,
    [
      Number(stripeSession.metadata?.order_id),
      stripeSession.id,
    ],
  );
}

module.exports = markOrderExpired