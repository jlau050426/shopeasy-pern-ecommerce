//imports
const express = require('express');
const router = express.Router();

//imports controllers
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/isAuth');
const verifyCsrfToken = require('../middleware/verifyCsrfToken');
const blockCartDuringPayment = require("../middleware/blockCartDuringPayment")

//get product middlleware
router.get('/', shopController.getIndex); //done
router.get('/product/:productID', shopController.getProduct) //done
router.get('/cart', isAuth, shopController.getCart) //done
router.post('/cart', isAuth,verifyCsrfToken, blockCartDuringPayment, shopController.postCart) //done
router.get('/delivery-options', shopController.getAvailableDeliveryOptionsDetails) //done
router.delete('/cart-delete-item/:id', isAuth, blockCartDuringPayment, verifyCsrfToken, shopController.removeCart) //done
router.put(`/cart-items/:id`, isAuth, verifyCsrfToken, blockCartDuringPayment, shopController.updateCartDeliveryOption)
router.get('/checkout/orders', isAuth, shopController.getOrders)
router.get('/checkout/order-&-product', isAuth, shopController.getOrderAndProduct)
router.post('/checkout',isAuth, verifyCsrfToken, shopController.postCheckout);
router.post('/checkout/continue', isAuth, verifyCsrfToken, shopController.continueCheckout)
router.delete('/orders/:orderId', isAuth, verifyCsrfToken, shopController.removeOrder)
router.get('/order/:orderID', isAuth, shopController.getInvoice)

module.exports = router;