//this file is to serve stripeWebhook controller database transaction

const db = require("../util/database");

const orderTransactionService = async (sessionUserID, stripeSessionID) => {
  //get current time
  const currentTime = Date.now();
  const client = await db.connect();
  try {
    //implement postgre transactions function to prevent data lost
    await client.query("BEGIN");

    //chcek unique stripe id
    const uniqueStripeSessionID = await client.query(
      ` SELECT * FROM orders WHERE stripe_session_id = $1`,
      [stripeSessionID],
    );

    if (uniqueStripeSessionID.rows.length > 0) {
      await client.query("COMMIT");
      return 
    }

    // unique id
    //add order into orders table
    const addOrders = await client.query(
      `INSERT INTO orders (user_id, stripe_session_id) VALUES ($1, $2) RETURNING id `,
      [sessionUserID, stripeSessionID],
    );

    //fetching cart information to be insert into order_items table
    const cart = await client.query(
      `
                SELECT
                cart.id,
                cart.quantity,
                cart.product_id,
                cart.delivery_options,
                products.title,
                products.price,
                products.description,
                products.imageurl,
                (cart.quantity * products.price) AS item_total,
                delivery_options.price_dollars,
                delivery_options.delivery_days
                FROM cart
                INNER JOIN products
                ON cart.product_id = products.id
                INNER JOIN delivery_options
                ON cart.delivery_options = delivery_options.id
                WHERE cart.user_id = $1`,
      [sessionUserID],
    );

    if ((cart.rows.length === 0)) {
      await client.query("ROLLBACK");
    } else {
      const orderID = addOrders.rows[0].id;
      for (const item of cart.rows) {
        const productID = item.product_id;
        const quantity = item.quantity;
        const price = item.price;
        // delivery_days in set in DEFAULT of 7 days in database
        const dateReceiveMs =
          currentTime + Number(item.delivery_days) * 24 * 60 * 60 * 1000;
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, date_receive_ms, user_id) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderID, productID, quantity, price, dateReceiveMs, sessionUserID],
        );
      }

      //remove cart after ordering
      await client.query(`DELETE FROM cart WHERE user_id = $1`, [
        sessionUserID,
      ]);

      //commit transaction
      await client.query("COMMIT");
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err
  } finally {
    client.release(); //prevent connection exhaustion
  }
};

module.exports = orderTransactionService;
