//imports
const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

//imports controllers
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/isAuth");
const verifyCsrfToken = require("../middleware/verifyCsrfToken");
const blockCartDuringPayment = require("../middleware/blockCartDuringPayment");

//get product middlleware
router.get("/", shopController.getIndex); //done
router.get("/product/:productID", shopController.getProduct); //done
router.get("/cart", isAuth, shopController.getCart); //done
router.post(
  "/cart",
  isAuth,
  verifyCsrfToken,
  blockCartDuringPayment,
  [
    body("productId").isInt({ min: 1 }).withMessage("Invalid product").toInt(),
    body("quantity")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Quantity must be between 1 and 10")
      .toInt(),
  ],
  shopController.postCart,
); //done
router.get(
  "/delivery-options",
  shopController.getAvailableDeliveryOptionsDetails,
); //done
router.delete(
  "/cart-delete-item/:id",
  isAuth,
  verifyCsrfToken,
  blockCartDuringPayment,
  [param("id").isInt({ min: 1 }).withMessage("Invalid cart item").toInt()],
  shopController.removeCart,
); //done
router.get("/pending-payment", isAuth, shopController.getPendingPayment);
router.put(
  `/cart-items/:id`,
  isAuth,
  verifyCsrfToken,
  blockCartDuringPayment,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid cart item").toInt(),
    body("deliveryOptionId")
      .isInt({ min: 1})
      .withMessage("Invalid delivery option")
      .toInt(),
  ],
  shopController.updateCartDeliveryOption,
);
router.get("/checkout/orders", isAuth, shopController.getOrders);
router.get(
  "/checkout/order-&-product",
  isAuth,
  shopController.getOrderAndProduct,
);
router.post("/checkout", isAuth, verifyCsrfToken, shopController.postCheckout);
router.post(
  "/checkout/continue",
  isAuth,
  verifyCsrfToken,
  shopController.continueCheckout,
);
router.delete(
  "/orders/:orderId",
  isAuth,
  verifyCsrfToken,
  shopController.removeOrder,
);
router.delete(
  "/remove-payment/:orderId",
  isAuth,
  verifyCsrfToken,
  shopController.removePayment,
);
router.delete(
  "/remove-expired/:orderId",
  isAuth,
  verifyCsrfToken,
  shopController.removeExpiredOrder,
);
router.get("/order/:orderID", isAuth, shopController.getInvoice);

module.exports = router;
