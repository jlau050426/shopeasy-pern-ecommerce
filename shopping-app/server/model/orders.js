const db = require("../util/database");

class Orders {
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
                order_items.price_dollars,
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
