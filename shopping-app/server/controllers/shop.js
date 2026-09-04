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
const orderTransactionService = require("../services/orderService.js");

const getIndex = async (req, res, next) => {
  const productsPerPage = 50;

  await pagination(
    req,
    next,
    productsPerPage,
    async (fetchPage, totalPages, page) => {
      if (totalPages > 0 && page > totalPages) {
        return res.status(404).json({
          message: "page exceeds maximum pages, redirecting to page 1.....",
          totalPages: totalPages,
          prods: fetchPage.rows,
        });
      }
      res.status(200).json({
        prods: fetchPage.rows,
        totalPages: totalPages,
        currentPage: page,
      });
    },
  );
};

const getProduct = async (req, res, next) => {
  const id = req.params.productID;
  try {
    const result = await Product.findProductByID(id);
    if (!result.rows[0]) {
      return res.status(404).json({ message: "No product Found!" });
    }
    res.status(200).json({
      product: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const postCart = async (req, res, next) => {
  const productID = req.body.productId;
  const quantity = req.body.quantity || 1;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");

  try {
    if (!productID) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    await Cart.addCart(productID, quantity, sessionUserID);

    io.to(`user-${sessionUserID}`).emit("cart:updated");

    //return JSON information
    return res.status(200).json({
      message: "Cart Added Successfully",
    });
  } catch (err) {
    next(err);
  }
};

const getCart = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;
  try {
    const result = await Cart.fetchAllCart(sessionUserID);
    let cartTotal = 0;
    let shippingCostTotal = 0;

    const cart = result.rows;

    cart.forEach((c) => {
      cartTotal += Number(c.item_total);
    });

    cart.forEach((c) => {
      shippingCostTotal += Number(c.price_dollars);
    });

    res.status(200).json({
      cart: cart,
      grandTotal: cartTotal,
      shippingCostTotal: shippingCostTotal,
    });
  } catch (err) {
    next(err);
  }
};

const getAvailableDeliveryOptionsDetails = async (req, res, next) => {
  try {
    const result = await Product.fetchDeliveryOptionsDetails();
    res.status(200).json({
      message: "Successfully fetch delivery options details",
      deliveryOptionsDetails: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const updateCartDeliveryOption = async (req, res, next) => {
  const cartId = req.params.id;
  const deliveryOptionId = req.body.deliveryOptionId;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");

  try {
    await Cart.updateCartDeliveryOptions(
      deliveryOptionId,
      cartId,
      sessionUserID,
    );
    io.to(`user-${sessionUserID}`).emit("cart:delivery-updated");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const removeCart = async (req, res, next) => {
  const currentCartID = req.params.id;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");
  try {
    await Cart.deleteCart(currentCartID, sessionUserID);
    io.to(`user-${sessionUserID}`).emit("cart:deleted");
    res.status(204).send();
  } catch (err) {
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
        product_id: order.product_id,
        title: order.title,
        quantity: order.quantity,
        price: order.price,
        imageurl: order.imageurl,
        total_price: order.total_price,
        estimated_delivery_days: order.delivery_days,
      });
    });

    res.status(200).json({
      orders: Object.values(groupedOrders),
      orderTotalPrice: orderTotalPrice,
    });
  } catch (err) {
    next(err);
  }
};

//for tracking product, track order and product id
const getOrderAndProduct = async (req, res, next) => {
  const orderID = req.query.orderID;
  const productID = req.query.productID;
  const sessionUserID = req.session.sessionUserID;

  if (!orderID || !productID) {
    return res
      .status(400)
      .json({ message: "orderID and productID are required" });
  }

  try {
    const result = await Orders.fetchOrderAndProductByID(
      sessionUserID,
      orderID,
      productID,
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Order Not Found!" });
    }
    res.status(200).json({
      order: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

//direct to Stripe API (place order)
const postCheckout = async (req, res, next) => {
  const sessionUserID = req.session.sessionUserID;

  try {
    const result = await Cart.fetchAllCart(sessionUserID);

    const cart = result.rows;

    if (cart.length === 0) {
      const err = new Error("Your Cart is Empty!");
      err.statusCode = 404;
      throw err;
    }

    const line_items = [];
    let grandTotal = 0;
    let shippingCostTotal = 0;

    cart.forEach((c) => {
      grandTotal += Number(c.price) * Number(c.quantity);
      shippingCostTotal += Number(c.price_dollars);
      line_items.push({
        price_data: {
          currency: "myr",

          product_data: {
            name: c.title,
          },

          //product price in cents
          unit_amount: Math.round(Number(c.price) * 100),
        },
        quantity: c.quantity,
      });

      line_items.push({
        price_data: {
          currency: "myr",

          product_data: {
            name: "Shipping",
          },

          //product price in cents
          unit_amount: Math.round(Number(c.price_dollars) * 100),
        },
        quantity: 1,
      });
    });

    const totalCost = grandTotal + shippingCostTotal;
    const tax = (totalCost * 0.1).toFixed(2);

    line_items.push({
      price_data: {
        currency: "myr",

        product_data: {
          name: "Tax (10%)",
        },

        //product price in cents
        unit_amount: Math.round(Number(tax) * 100),
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items,

      

      payment_method_types: ["card"],

      metadata: {
        user_id: sessionUserID.toString(),
      },

      success_url: `http://localhost:5173/checkout/orders`,

      cancel_url: `http://localhost:5173/checkout`,
    });
    res.status(201).json({
      checkoutUrl: session.url,
    });
  } catch (err) {
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
    console.log(`⚠️ Webhook signature verification failed.`, error.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const sessionUserID = session.metadata.user_id;
      const stripeSessionID = session.id;

      try {
        await orderTransactionService(sessionUserID, stripeSessionID);
        return res.sendStatus(200);
      } catch (err) {
        next(err);
      }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return res.sendStatus(200);
};

const removeOrder = async (req, res, next) => {
  const orderId = req.params.orderId;
  const sessionUserID = req.session.sessionUserID;

  try {
    //remove from orders table
    await Orders.deleteOrderItems(sessionUserID, orderId);
    await Orders.deleteOrder(sessionUserID, orderId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getInvoice = async (req, res, next) => {
  //get user id
  const sessionUserID = req.session.sessionUserID;

  //get order id
  const orderID = req.params.orderID;

  //invoice name will follow invoice-(orderID).pdf
  const invoiceName = `invoice-${orderID}.pdf`;
  //invoice path
  const invoicePath = path.join(dirname, "data", invoiceName);

  const pdfDoc = new PDFDocument();

  //getOrdersByID
  try {
    const ordersByID = await Orders.fetchOrdersByID(sessionUserID, orderID);
    if (ordersByID.rows.length === 0) {
      const err = new Error("Order Not Found");
      err.statusCode = 404;
      throw err;
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
      const err = new Error(error);
      console.error(err);
      err.statusCode = 500;
      next(err);
    });
  } catch (err) {
    next(err);
  }
};

exports.getCart = getCart;
exports.postCheckout = postCheckout;
exports.getIndex = getIndex;
exports.getOrders = getOrders;
exports.getOrderAndProduct = getOrderAndProduct;
exports.getProduct = getProduct;
exports.postCart = postCart;
exports.getAvailableDeliveryOptionsDetails = getAvailableDeliveryOptionsDetails;
exports.updateCartDeliveryOption = updateCartDeliveryOption;
exports.removeCart = removeCart;
exports.removeOrder = removeOrder;
exports.getInvoice = getInvoice;
exports.stripeWebhook = stripeWebhook;
