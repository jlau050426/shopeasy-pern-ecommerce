//imports
const path = require('path');
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

//imports controllers
const adminController = require('../controllers/admin')

//imports middleware
const isAuth = require('../middleware/is-auth')

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', isAuth, [
    body("title")
        .trim()
        .isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price").isFloat().toFloat(),
    body("description")
        .isLength({ min: 6 }).withMessage("Min 6 characters")
        .trim()
], adminController.postAddProduct);

// /admin/edit-product ==> get
router.get('/edit-product/:productID', isAuth, adminController.getEditProduct)

router.post('/edit-product', isAuth, [
    body("title")
        .trim()
        .isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price").isFloat().toFloat(),
    body("description")
        .isLength({ min: 6 }).withMessage("Min 6 characters")
        .trim()
], adminController.postEditProduct)

//delete
router.delete('/delete-product/:productID', isAuth, adminController.removeProduct)

// /admin/products
router.get('/products', isAuth, adminController.getProducts)

module.exports = router
