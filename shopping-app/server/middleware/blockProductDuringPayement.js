const db = require("../util/database");

const blockProductDuringPayment = async (req, res, next) => {
  const userId = req.session.sessionUserID;
  try {
    const result = await db.query(
      `
            SELECT id, stripe_session_id
            FROM orders
            WHERE user_id = $1
            AND
            status = 'PENDING_PAYMENT'
            ORDER BY
            created_at DESC LIMIT 1`,
      [userId],
    );

    if (result.rows.length > 0) {
      return res.status(409).json({
        code: "CHECKOUT_IN_PROGRESS",
        errorMessage: "PENDING PAYMENT! PRODUCT MODIFICATION DISABLED!",
        orderId: result.rows[0].id,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = blockProductDuringPayment
