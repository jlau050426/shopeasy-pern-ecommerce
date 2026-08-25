//imports
const express = require('express');
const router = express.Router();

//imports controllers
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

//get product middlleware
router.get('/', shopController.getIndex); //done
router.get('/products', shopController.getProducts) //done
router.get('/product/:productID', shopController.getProduct) //done
router.get('/cart', isAuth, shopController.getCart) //done
router.post('/cart', isAuth, shopController.postCart) //done
router.get('/delivery-options', shopController.getAvailableDeliveryOptionsDetails) //done
router.delete('/cart-delete-item/:id', isAuth, shopController.removeCart) //done
router.put(`/api/cart-items/:id`, isAuth, shopController.updateCartDeliveryOption)
router.get('/checkout/orders', isAuth, shopController.getOrders)
router.get('/checkout', isAuth, shopController.getCheckout)
router.post('/checkout',isAuth,shopController.postCheckout);
router.delete('/orders/:orderId', isAuth, shopController.removeOrder)
router.get('/order/:orderID', isAuth, shopController.getInvoice)

module.exports = router;