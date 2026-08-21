//imports
const express = require('express');
const router = express.Router();

//imports controllers
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

//get product middlleware
router.get('/', shopController.getIndex);
router.get('/products', shopController.getProducts)
router.get('/product/:productID', shopController.getProduct)
router.get('/cart', isAuth, shopController.getCart)
router.post('/cart', isAuth, shopController.postCart)
router.post('/cart-delete-item', isAuth, shopController.removeCart)
router.get('/checkout/orders', isAuth, shopController.getOrders)
router.get('/checkout', isAuth, shopController.getCheckout)
router.post('/checkout',isAuth,shopController.postCheckout);
router.get('/order/:orderID', isAuth, shopController.getInvoice)
router.post('/stripe-webhook', express.raw({type: 'application/json'}), shopController.stripeWebhook)

module.exports = router;