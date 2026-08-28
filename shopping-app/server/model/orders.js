const db = require("../util/database");

class Orders {
  static async addOrders(sessionUserID, stripeSessionID) {
    return db.query(
      `
                INSERT INTO orders (user_id, stripe_session_id)
                VALUES ($1, $2)
                RETURNING id
                `,
      [sessionUserID, stripeSessionID],
    );
  }

  static async checkUniqueStripeID(stripeSessionID) {
    return db.query(
      `
                SELECT * FROM orders WHERE stripe_session_id = $1
                `,
      [stripeSessionID],
    );
  }

  static async postOrderItems(
    orderID,
    productID,
    quantity,
    price,
    dateReceiveMs,
    sessionUserID,
  ) {
    return db.query(
      `INSERT INTO order_items
      (order_id, product_id, quantity, price, date_receive_ms, user_id)
      VALUES 
      ($1, $2, $3, $4, $5, $6)`,
      [orderID, productID, quantity, price, dateReceiveMs, sessionUserID],
    );
  }

  static fetchAllOrders(sessionUserID) {
    return db.query(
      `
                SELECT
                orders.id AS order_id,
                orders.status,
                orders.created_at,
                order_items.product_id,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS total_price,
                order_items.date_receive_ms,
				products.title,
				products.imageurl
                FROM order_items
                INNER JOIN orders
                ON order_items.order_id = orders.id
				INNER JOIN products
				ON order_items.product_id = products.id
                WHERE orders.user_id = $1
                `,
      [sessionUserID],
    );
  }

  static fetchOrdersByID(sessionUserID, orderID) {
    return db.query(
      `
                SELECT
                orders.id AS order_id,
                orders.status,
                orders.created_at,
                order_items.product_id,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS total_price,
                order_items.date_receive_ms,
				products.title,
				products.imageurl
                FROM order_items
                INNER JOIN orders
                ON order_items.order_id = orders.id
				INNER JOIN products
				ON order_items.product_id = products.id
                WHERE orders.user_id = $1 
                AND
                orders.id = $2
                `,
      [sessionUserID, orderID],
    );
  }

  //track product by order id and product id
  static fetchOrderAndProductByID(sessionUserID, orderID, productID) {
    return db.query(
      `
                SELECT
                orders.id AS order_id,
                orders.status,
                orders.created_at,
                order_items.product_id,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS total_price,
                order_items.date_receive_ms,
				products.title,
				products.imageurl
                FROM order_items
                INNER JOIN orders
                ON order_items.order_id = orders.id
				INNER JOIN products
				ON order_items.product_id = products.id
                WHERE orders.user_id = $1
                AND
                orders.id = $2
                AND
                order_items.product_id = $3
                `,
      [sessionUserID, orderID, productID],
    );
  }

  static deleteOrder(sessionUserID, orderId) {
    return db.query(
      `
                DELETE FROM orders
                WHERE
                user_id = $1
                AND
                id = $2
                `,
      [sessionUserID, orderId],
    );
  }

  static deleteOrderItems(sessionUserID, orderId) {
    return db.query(
      `
                DELETE FROM order_items
                WHERE
                user_id = $1
                AND
                order_id = $2
                `,
      [sessionUserID, orderId],
    );
  }
}

module.exports = Orders;
