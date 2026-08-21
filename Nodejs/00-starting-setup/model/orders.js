const db = require('../util/database')

class Orders {

    static addOrders(sessionUserID, stripeSessionID) {
        return (
            db.query(
                `
                INSERT INTO orders (user_id, stripe_session_id)
                VALUES ($1, $2)
                RETURNING id
                `,
                [
                    sessionUserID,
                    stripeSessionID
                ]
            )
        )
    }

    static checkUniqueStripeID(stripeSessionID){
        return(
            db.query(
                `
                SELECT * FROM orders WHERE stripe_session_id = $1
                `, 
                [
                    stripeSessionID
                ]
            )
        )
    }

    static postOrderItems(orderID, productID, quantity, price) {
        return (
            db.query(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    orderID,
                    productID,
                    quantity,
                    price
                ]
            )
        )
    }

    static fetchAllOrders(sessionUserID) {
        return (
            db.query(
                `
                SELECT
                orders.id AS order_id,
                orders.status,
                orders.created_at,
                order_items.product_id,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS total_price,
				products.title,
				products.imageurl
                FROM order_items
                INNER JOIN orders
                ON order_items.order_id = orders.id
				INNER JOIN products
				ON order_items.product_id = products.id
                WHERE orders.user_id = $1
                `,
                [
                    sessionUserID
                ]
            )
        )
    }

    static fetchOrdersByID(sessionUserID, orderID) {
        return (
            db.query(
                `
                SELECT
                orders.id AS order_id,
                orders.status,
                orders.created_at,
                order_items.product_id,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS total_price,
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
                [
                    sessionUserID,
                    orderID
                ]
            )
        )
    }

}

module.exports = Orders