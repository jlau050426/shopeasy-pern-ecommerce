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
const {
  createPendingOrder,
  attachStripeSession,
  getPendingCheckout,
} = require("../services/checkoutService.js");
const { markOrderPaid } = require("../services/markOrderPaid.js");
const markOrderExpired = require("../services/markOrderExpired.js");
const db = require("../util/database.js");
const { validationResult } = require("express-validator");

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
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      message: error.array()[0].msg,
    });
  }

  const productID = req.body.productId;
  const quantity = req.body.quantity ?? 1;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");

  try {
    //before add to cart, make sure the product is still available
    const product = await Product.findProductByID(productID);
    if (product.rows.length === 0) {
      return res.status(404).json({
        message: "This product is no longer available",
      });
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
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      message: error.array()[0].msg,
    });
  }
  const cartId = req.params.id;
  const deliveryOptionId = req.body.deliveryOptionId;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");

  try {
    //check if deliveryOptionId exist
    const options = await Product.findDeliveryOptionByID(deliveryOptionId);
    if (options.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery option not found",
      });
    }

    const result = await Cart.updateCartDeliveryOptions(
      deliveryOptionId,
      cartId,
      sessionUserID,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    io.to(`user-${sessionUserID}`).emit("cart:delivery-updated");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const removeCart = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      message: error.array()[0].msg,
    });
  }
  const currentCartID = req.params.id;
  const sessionUserID = req.session.sessionUserID;
  const io = req.app.get("io");
  try {
    const result = await Cart.deleteCart(currentCartID, sessionUserID);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Product Not Found",
      });
    }

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

    //group orders by order id
    const groupedOrders = {};
    orders.forEach((order) => {
      const orderID = order.order_id;
      const itemTotalPrice = Number(order.total_price);
      const shippingCost = Number(order.price_dollars);

      //TODO:MODIFY HERE
      //check the presence of order object with order_id x
      if (!groupedOrders[orderID]) {
        //for that particular order object in index x
        groupedOrders[orderID] = {
          id: orderID,
          created_at: order.created_at,
          single_order_total_price: 0,
          single_order_total_price_after_tax: 0,
          status: order.status,
          items: [],
        };
      }

      groupedOrders[orderID].single_order_total_price +=
        itemTotalPrice + shippingCost;
      groupedOrders[orderID].single_order_total_price_after_tax =
        groupedOrders[orderID].single_order_total_price * 1.1;

      //push object details in object format
      groupedOrders[order.order_id].items.push({
        product_id: order.product_id,
        title: order.title,
        quantity: order.quantity,
        price: order.price,
        imageurl: order.imageurl,
        total_price: order.total_price,
        estimated_delivered_time: order.date_receive_ms,
      });
    });

    res.status(200).json({
      orders: Object.values(groupedOrders),
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
    const pending = await createPendingOrder(sessionUserID);

    const lineItems = [];
    let grandTotal = 0;
    let shippingCostTotal = 0;

    pending.cart.forEach((c) => {
      grandTotal += Number(c.price) * Number(c.quantity); //in dollars not cents
      shippingCostTotal += Number(c.price_dollars); // in dollars not cents
      lineItems.push({
        price_data: {
          currency: "myr",

          product_data: {
            name: c.title,
          },

          //product price in cents
          unit_amount: Math.round(Number(c.price) * 100), //convert to cents
        },
        quantity: c.quantity,
      });

      lineItems.push({
        price_data: {
          currency: "myr",

          product_data: {
            name: `Shipping - ${c.title}`,
          },

          //shipping price in cents
          unit_amount: Math.round(Number(c.price_dollars) * 100),
        },
        quantity: 1,
      });
    });

    const totalCostBeforeTax = grandTotal + shippingCostTotal; //in dollars
    const tax = (totalCostBeforeTax * 0.1).toFixed(2); //10% in dollars

    lineItems.push({
      price_data: {
        currency: "myr",

        product_data: {
          name: "Tax (10%)",
        },

        //product price in cents
        unit_amount: Math.round(Number(tax) * 100), //convert tax to cents
      },
      quantity: 1,
    });

    const stripeSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        payment_method_types: ["card"],

        metadata: {
          order_id: String(pending.order.id),
          user_id: sessionUserID.toString(),
        },

        success_url: `${process.env.FRONTEND_URL}/checkout/orders`,

        cancel_url: `${process.env.FRONTEND_URL}/checkout/orders`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      {
        idempotencyKey: `checkout-order-${pending.order.id}`,
      },
    );
    await attachStripeSession(pending.order.id, sessionUserID, stripeSession);
    res.status(201).json({
      checkoutUrl: stripeSession.url,
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({
        message: err.message,
      });
    }

    if (err.statusCode === 409) {
      return res.status(409).json({
        code: "CHECKOUT_IN_PROGRESS",
        message: err.message,
        orderId: err.order?.id,
      });
    }
    return next(err);
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
  try {
    const session = event.data.object;

    //sessions created by this shop always carry order_id and user_id
    const isShopSession =
      Number.isInteger(Number(session.metadata?.order_id)) &&
      Number.isInteger(Number(session.metadata?.user_id));

    switch (event.type) {
      case "checkout.session.completed":
        if (!isShopSession) {
          console.log(
            `Ignoring ${event.type} ${session.id}: not created by this shop`,
          );
          break;
        }
        if (session.payment_status === "paid") {
          await markOrderPaid(session);
        }
        break;

      case "checkout.session.expired":
        if (!isShopSession) {
          console.log(
            `Ignoring ${event.type} ${session.id}: not created by this shop`,
          );
          break;
        }
        await markOrderExpired(session);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return res.sendStatus(200);
  } catch (error) {
    if (error.isPermanent) {
      //retrying will never fix this -> 200 so Stripe stops retrying, but keep a record
      console.error(
        `Stripe webhook ignored: ${event.type} ${event.id} (session ${event.data.object.id}):`,
        error.message,
      );
      return res.sendStatus(200);
    }

    //temporary problem (e.g. database down) -> 500 so Stripe retries later
    console.error("Stripe webhook processing failed:", error);
    return res.sendStatus(500);
  }
};

const removeOrder = async (req, res, next) => {
  const orderId = req.params.orderId;
  const sessionUserID = req.session.sessionUserID;
  try {
    //check pending payment first. If pending payment, disable remove order
    const result = await db.query(
      `
  SELECT status
  FROM orders
  WHERE id = $1
    AND user_id = $2
  `,
      [orderId, sessionUserID],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (result.rows[0].status !== "PAID") {
      return res.status(409).json({
        message: "Only paid orders can be marked as received",
      });
    }
    //remove from orders table
    await Orders.deleteOrderItems(sessionUserID, orderId);
    await Orders.deleteOrder(sessionUserID, orderId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const removePayment = async (req, res, next) => {
  const orderId = req.params.orderId;
  const sessionUserID = req.session.sessionUserID;
  try {
    //check pending payment first. If pending payment, disable remove order
    const result = await db.query(
      `
      SELECT status, stripe_session_id
      FROM orders
      WHERE id = $1
        AND user_id = $2
      `,
      [orderId, sessionUserID],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (result.rows[0].status !== "PENDING_PAYMENT") {
      return res.status(409).json({
        message: "Only pending payment can be removed",
      });
    } else {
      const order = result.rows[0];

      if (!order.stripe_session_id) {
        return res.status(409).json({
          message: "The Stripe Checkout Session is still being created.",
        });
      }

      let stripeSession = await stripe.checkout.sessions.retrieve(
        order.stripe_session_id,
      );

      //verify the session belongs to this order and user
      if (
        String(stripeSession.metadata?.order_id) !== String(orderId) ||
        String(stripeSession.metadata?.user_id) !== String(sessionUserID)
      ) {
        return res.status(409).json({
          message: "Stripe Checkout Session does not match this order.",
        });
      }

      //make stripeSession expire if it is open
      if (stripeSession.status === "open") {
        try {
          stripeSession = await stripe.checkout.sessions.expire(
            stripeSession.id,
          );
        } catch (error) {
          // The customer might have completed payment at the same time
          // that they clicked Cancel Payment.
          stripeSession = await stripe.checkout.sessions.retrieve(
            order.stripe_session_id,
          );
        }
      }

      if (stripeSession.status !== "expired") {
        return res.status(409).json({
          message:
            "The payment is currently being processed and cannot be cancelled.",
        });
      }

      await Orders.deleteOrderItems(sessionUserID, orderId);
      await Orders.deleteOrder(sessionUserID, orderId);

      return res.status(204).send();
    }
  } catch (err) {
    next(err);
  }
};

const removeExpiredOrder = async (req, res, next) => {
  const orderId = req.params.orderId;
  const sessionUserID = req.session.sessionUserID;
  try {
    //check pending payment first. If pending payment, disable remove order
    const result = await db.query(
      `
  SELECT status
  FROM orders
  WHERE id = $1
    AND user_id = $2
  `,
      [orderId, sessionUserID],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (result.rows[0].status !== "EXPIRED") {
      return res.status(409).json({
        message: "Only expired payment can be removed",
      });
    }
    //remove from orders table
    await Orders.deleteOrderItems(sessionUserID, orderId);
    await Orders.deleteOrder(sessionUserID, orderId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const continueCheckout = async (req, res, next) => {
  try {
    const { order, stripeSession } = await getPendingCheckout(
      req.session.sessionUserID,
    );

    if (stripeSession.status === "open" && stripeSession.url) {
      return res.status(200).json({
        state: "open",
        orderId: order.id,
        checkoutUrl: stripeSession.url,
      });
    }

    if (
      stripeSession.status === "complete" &&
      stripeSession.payment_status === "paid"
    ) {
      /*
       * The webhook remains the primary payment mechanism,
       * but markOrderPaid is idempotent, so calling it here
       * can safely handle a delayed webhook.
       */
      await markOrderPaid(stripeSession);

      return res.status(200).json({
        state: "paid",
        orderId: order.id,
      });
    }

    if (stripeSession.status === "expired") {
      await markOrderExpired(stripeSession);

      return res.status(410).json({
        code: "CHECKOUT_EXPIRED",
        message:
          "This payment session has expired. Please start checkout again.",
        orderId: order.id,
      });
    }

    return res.status(409).json({
      code: "PAYMENT_PROCESSING",
      message: "Your payment is still being processed.",
      orderId: order.id,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        code: "NO_PENDING_PAYMENT",
        message: error.message,
      });
    }

    if (error.statusCode === 409) {
      return res.status(409).json({
        code: "CHECKOUT_SESSION_MISSING",
        message: error.message,
      });
    }
    return next(error);
  }
};

const getPendingPayment = async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT id
      FROM orders
      WHERE user_id = $1
        AND status = 'PENDING_PAYMENT'
      LIMIT 1
      `,
      [req.session.sessionUserID],
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        message: "Pending Payment Exist!",
      });
    } else {
      return res.status(204).send();
    }
  } catch (error) {
    next(error);
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
      return res.status(404).json({
        message: "Order Not Found",
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
exports.removePayment = removePayment;
exports.removeExpiredOrder = removeExpiredOrder;
exports.getInvoice = getInvoice;
exports.stripeWebhook = stripeWebhook;
exports.continueCheckout = continueCheckout;
exports.getPendingPayment = getPendingPayment;
