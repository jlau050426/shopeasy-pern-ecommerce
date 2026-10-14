const db = require("../util/database");

//hereby will define product class
class Product {
  //contructor
  constructor(title, imageURL, price, description) {
    this.title = title;
    this.imageURL = imageURL;
    this.price = price;
    this.description = description;
  }

  //save method
  save() {
    return db.query(
      "INSERT INTO products (title, price, description, imageurl) VALUES ($1, $2, $3, $4)",
      [this.title, this.price, this.description, this.imageURL],
    );
  }

  //fetch all cart
  static fetchPage(limit, offset) {
    return db.query(
      `
            SELECT *
            FROM products
            ORDER BY id
            LIMIT $1
            OFFSET $2
            `,
      [limit, offset],
    );
  }

  static countProducts() {
    return db.query("SELECT COUNT(*) FROM products");
  }

  static editProduct(id, updatedProduct) {
    return db.query(
      `UPDATE products
                SET title = $1,
                    price = $2,
                    description = $3,
                    imageurl = $4
                WHERE id = $5`,
      [
        updatedProduct.title,
        updatedProduct.price,
        updatedProduct.description,
        updatedProduct.imageURL,
        id,
      ],
    );
  }

  //only deletes the product if no order has ever included it
  static deleteProduct(id) {
    return db.query(
      `DELETE FROM products
         WHERE id = $1
         AND NOT EXISTS (
             SELECT 1 FROM order_items WHERE order_items.product_id = $1
         )`,
      [id],
    );
  }
  static findProductByID(id) {
    return db.query("SELECT * FROM products WHERE id = $1", [id]);
  }

  static fetchDeliveryOptionsDetails() {
    return db.query(
      `
            SELECT id, delivery_days, price_dollars
            FROM delivery_options
            `,
    );
  }

  static findDeliveryOptionByID(id) {
    return db.query("SELECT id FROM delivery_options WHERE id = $1", [id]);
  }
}

module.exports = Product;
