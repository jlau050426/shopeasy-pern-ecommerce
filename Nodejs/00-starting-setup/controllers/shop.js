//import product model
const Product = require("../model/product");
const Cart = require("../model/cart");
const Orders = require("../model/orders");
const dirname = require("../util/path.js");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const stripe = require("../util/stripe-payment.js");
const { pagination } = require("../util/pagination.js");
const db = require('../util/database.js')

// const getIndex = async (req, res, next) => {
//   const productsPerPage = 2;
//   await pagination(
//     req,
//     res,
//     productsPerPage,
//     "/",
//     async (fetchPage, totalPages) => {
//       res.render("../views/shop/index.ejs", {
//         prods: fetchPage.rows,
//         pageTitle: "Shop",
//         path: "/",
//         totalPages: totalPages,
//         errorMessage: req.flash("error"),
//       });
//     },
//   );
// };

const getIndex = async (req, res, next) => {
  const productsPerPage = 2;
  await pagination(
    req,
    next,
    productsPerPage,
    "/",
    async (fetchPage, totalPages) => {
      res.status(200).json({
        prods: fetchPage.rows[0],
        totalPages: totalPages
      })
    },
  );
};

const getProducts = async (req, res, next) => {
  const productsPerPage = 2;

  await pagination(
    req,
    res,
    productsPerPage,
    "/products",
    async (fetchPage, totalPages) => {
      res.render("../views/shop/product-list.ejs", {
        prods: fetchPage.rows,
        pageTitle: "Products",
        path: "/products",
        totalPages: totalPages,
        errorMessage: req.flash("error"),
      });
    },
  );
};

const getProduct = async (req, res, next) => {
  const id = req.params.productID;
  try {
    const result = await Product.findProductByID(id);
    if (!result.rows[0]) {
      return res.status(404).render("../views/404.ejs", {
        pageTitle: "Product Not Found",
        path: "",
      });
    }
    res.render("../views/shop/product-detail.ejs", {
      product: result.rows[0],
      pageTitle: "Product Details",
      path: "/products",
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const postCart = async (req, res, next) => {
  const productID = req.body.prodID;
  const sessionUserID = req.session.sessionUserID;
  try {
    await Cart.addCart(productID, sessionUserID);
    res.redirect("/cart");
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const getCart = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;
  try {
    const result = await Cart.fetchAllCart(sessionUserID);
    let cartTotal = 0;
    const cart = result.rows;
    cart.forEach((c) => {
      cartTotal += Number(c.item_total);
    });
    res.render("../views/shop/cart.ejs", {
      grandTotal: cartTotal,
      cart: cart,
      pageTitle: "Your Cart",
      path: "/cart",
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const removeCart = async (req, res, next) => {
  const currentCartID = req.body.productID;
  const userID = req.session.sessionUserID;
  try {
    await Cart.deleteCart(currentCartID, userID);
    console.log("Cart deleted successfully!");
    res.redirect("/cart");
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;
  try {
    const result = await Orders.fetchAllOrders(sessionUserID);
    const orders = result.rows;

    let orderTotalPrice = 0;

    //group orders by order id
    const groupedOrders = {};

    orders.forEach((order) => {
      const orderID = order.order_id;
      const itemTotalPrice = Number(order.total_price);
      orderTotalPrice += itemTotalPrice;

      //TODO:MODIFY HERE
      //check the presence of order object with order_id x
      if (!groupedOrders[orderID]) {
        //for that particular order object in index x
        groupedOrders[orderID] = {
          id: orderID,
          created_at: order.created_at,
          single_order_total_price: 0,
          items: [],
        };
      }

      groupedOrders[orderID].single_order_total_price += itemTotalPrice;

      //push object details in object format
      groupedOrders[order.order_id].items.push({
        title: order.title,
        quantity: order.quantity,
        price: order.price,
        imageurl: order.imageurl,
        total_price: order.total_price,
      });
    });

    res.render("../views/shop/orders.ejs", {
      pageTitle: "Your Orders",
      path: "/orders",
      orders: Object.values(groupedOrders),
      orderTotalPrice: orderTotalPrice,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

//get checkout page
const getCheckout = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;

  try {
    const result = await Cart.fetchAllCart(sessionUserID);

    const cart = result.rows;

    let cartTotal = 0;

    cart.forEach((c) => {
      cartTotal += Number(c.item_total);
    });

    return res.render("../views/shop/checkout.ejs", {
      grandTotal: cartTotal,
      cart: cart,
      pageTitle: "Checkout",
      path: "/checkout",
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

//direct to Stripe API
const postCheckout = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;

  try {
    const result = await Cart.fetchAllCart(sessionUserID);

    const cart = result.rows;

    if (cart.length === 0) {
      req.flash("error", "your cart is empty");
      return res.redirect("/cart");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: cart.map((c) => ({
        price_data: {
          currency: "myr",

          product_data: {
            name: c.title,
          },

          //product price in cents
          unit_amount: Math.round(Number(c.price) * 100),
        },
        quantity: c.quantity,
      })),

      metadata: {
        user_id: sessionUserID.toString(),
      },

      success_url: `${req.protocol}://${req.get("host")}/checkout/orders`,

      cancel_url: `${req.protocol}://${req.get("host")}/checkout`,
    });
    return res.redirect(303, session.url);
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

//stripe webhook handler
const stripeWebhook = async (req, res, next) => {
  let event;
  // Get the signature sent by Stripe
  const signature = req.headers["stripe-signature"];

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const sessionUserID = session.metadata.user_id;
      const stripeSessionID = session.id;
      console.log(stripeSessionID);

      //create order
      try {
        //implement postgre transactions function to prevent data lost
        await db.query("BEGIN")
        
        //chcek unique stripe id
        const uniqueStripeSessionID =
          await Orders.checkUniqueStripeID(stripeSessionID);

        if (uniqueStripeSessionID.rows.length === 0) {
          // unique id
          //add order into orders table
          const addOrders = await Orders.addOrders(
            sessionUserID,
            stripeSessionID,
          );
          //fetching cart information to be insert into order_items table
          const cart = await Cart.fetchAllCart(sessionUserID);
          const orderID = addOrders.rows[0].id;
          for (const item of cart.rows) {
            const productID = item.product_id;
            const quantity = item.quantity;
            const price = item.price;

            await Orders.postOrderItems(orderID, productID, quantity, price);
          }
          //remove cart after ordering
          await Cart.deleteOrderedCart(sessionUserID);
        } else {
          return res.sendStatus(200);
        }
        await db.query("COMMIT")
      } catch (error) {
        await db.query('ROLLBACK')
        const err = new Error(error);
        err.statusCode = 500;
        next(err);
      }

      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return res.sendStatus(200);
};

const getInvoice = async (req, res, next) => {
  //get user id
  const userID = req.session.sessionUserID;

  //get order id
  const orderID = req.params.orderID;

  //invoice name will follow invoice-(orderID).pdf
  const invoiceName = `invoice-${orderID}.pdf`;
  //invoice path
  const invoicePath = path.join(dirname, "data", invoiceName);

  const pdfDoc = new PDFDocument();

  //getOrdersByID
  try {
    const ordersByID = await Orders.fetchOrdersByID(userID, orderID);
    if (ordersByID.rows.length === 0) {
      return res.status(404).render("../views/404.ejs", {
        pageTitle: "Order Not Found",
        path: "",
      });
    }
    const creationDateTime = ordersByID.rows[0].created_at.toLocaleDateString();

    const writeStream = fs.createWriteStream(invoicePath); // write to PDF
    pdfDoc.pipe(writeStream);
    // =========================
    // Header
    // =========================

    pdfDoc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text("INVOICE", 50, 50);

    // Order information
    pdfDoc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#777777")
      .text(`Order #${orderID}`, 50, 92);

    pdfDoc.text(`Created On: ${creationDateTime}`, 50, 108);

    // Invoice number
    pdfDoc.fontSize(10).fillColor("#777777").text(`INV-${orderID}`, 400, 65, {
      width: 145,
      align: "right",
    });

    // Divider
    pdfDoc.moveTo(50, 140).lineTo(545, 140).strokeColor("#dddddd").stroke();

    // =========================
    // Table Header
    // =========================

    let y = 165;

    pdfDoc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#777777")
      .text("PRODUCT", 50, y);

    pdfDoc.text("PRICE", 330, y, {
      width: 65,
      align: "right",
    });

    pdfDoc.text("QTY", 405, y, {
      width: 40,
      align: "right",
    });

    pdfDoc.text("SUBTOTAL", 455, y, {
      width: 90,
      align: "right",
    });

    // Divider
    y += 20;

    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor("#dddddd").stroke();

    y += 15;

    // =========================
    // Products
    // =========================

    let total = 0;
    ordersByID.rows.forEach((row) => {
      const subtotal = Number(row.total_price);
      total += Number(subtotal);
      pdfDoc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#222222")
        .text(row.title, 50, y, {
          width: 260,
        });
      pdfDoc.text(`RM ${row.price}`, 330, y, {
        width: 65,
        align: "right",
      });
      pdfDoc.text(row.quantity.toString(), 405, y, {
        width: 40,
        align: "right",
      });

      pdfDoc.text(`RM ${subtotal}`, 455, y, {
        width: 90,
        align: "right",
      });

      y += 30;
    });

    // =========================
    // Total
    // =========================

    y += 10;

    pdfDoc.moveTo(350, y).lineTo(545, y).strokeColor("#dddddd").stroke();
    y += 20;
    pdfDoc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#777777")
      .text("TOTAL", 350, y, {
        width: 90,
        align: "right",
      });

    pdfDoc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(`RM ${total}`, 440, y - 3, {
        width: 105,
        align: "right",
      });

    // =========================
    // Footer
    // =========================

    pdfDoc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#999999")
      .text("Thank you for your order.", 50, 750, {
        width: 495,
        align: "center",
      });
    //mark the end of generating pdf
    pdfDoc.end();

    writeStream.on("finish", () => {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${invoiceName}"`,
      );
      res.setHeader("content-type", "application/pdf");
      //stream file instead of read file for large file
      const readStream = fs.createReadStream(invoicePath);
      //send as response
      readStream.pipe(res);
    });

    writeStream.on("error", (error) => {
      console.error(error);
      next(error);
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

exports.getProducts = getProducts;
exports.getCart = getCart;
exports.getCheckout = getCheckout;
exports.postCheckout = postCheckout;
exports.getIndex = getIndex;
exports.getOrders = getOrders;
exports.getProduct = getProduct;
exports.postCart = postCart;
exports.removeCart = removeCart;
exports.getInvoice = getInvoice;
exports.stripeWebhook = stripeWebhook;
