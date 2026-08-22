const db = require('../util/database')

// we are not creating a new cart! Just parse in specific product into cart
class Cart {

    //we will add the existing product into cart instead
    static addCart(id, quantity = 1, sessionUserID) {
        return (
            db.query(
                `INSERT INTO cart(product_id, quantity, user_id)
                VALUES($1, $2, $3)
                ON CONFLICT(product_id, user_id)
                DO UPDATE
                SET quantity = cart.quantity + $2`,
                [
                    id,
                    quantity,
                    sessionUserID
                ]
            )

        )
    }

    static fetchAllCart(sessionUserID) {
        return (
            db.query(`
                SELECT 
                cart.id,
                cart.quantity,
                cart.product_id,
                products.title,
                products.price,
                products.description,
                products.imageurl,
                (cart.quantity * products.price) AS item_total
                FROM cart
                INNER JOIN products
                ON cart.product_id = products.id
                WHERE cart.user_id = $1`, 
                [
                    sessionUserID
                ]
            )
        )
    }

    static deleteCart(id, userID) {
        return (
            db.query(
                `DELETE FROM cart 
                WHERE 
                id = $1 AND user_id = $2`,
                [
                    id,
                    userID
                ]
            )
        )
    }

    static deleteOrderedCart(sessionUserID){
        return(
            db.query(
                `DELETE FROM cart WHERE user_id = $1`,
                [
                    sessionUserID
                ]
            )
        )
    }
}

module.exports = Cart