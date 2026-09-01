//import product model
const Product = require("../model/product");
const fileOperator = require("../util/file");
const { validationResult } = require("express-validator");
const path = require("path");

//post add product form
const postAddProduct = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;

  if (!image) {
    return res.status(400).json({
      errorMessage: "Please Insert an Image!",
    });
  }
  const imageURL = image.filename;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  //if errors occurs, remove the image file that have been parsed into local
  if (!errors.isEmpty()) {
    //remove replaced image from local
    await fileOperator.removeImage(image.path, next);
    return res.status(422).json({
      errorMessage: errors.array()[0].msg,
    });
  }

  try {
    const newProduct = new Product(title, imageURL, price, description);
    await newProduct.save();
    res.status(201).json({
      successMessage: "Product Added Successfully!",
    });
  } catch (err) {
    if (image) {
      await fileOperator.removeImage(image.path, next);
    }
    next(err);
  }
};

const getEditProduct = async (req, res, next) => {
  const productID = req.params.productID;
  try {
    const result = await Product.findProductByID(productID);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({
        errorMessage: "No Product Found!",
      });
    }

    return res.status(200).json({
      currentID: productID,
      currentTitle: product.title,
      currentPrice: product.price,
      currentDescription: product.description,
    });
  } catch (err) {
    next(err);
  }
};

const getAddProduct = (req, res, next) => {
  try {
    return res.status(200).json();
  } catch (err) {
    next(err)
  }
};

const getAdminPage = (req, res, next) => {
  try {
    return res.status(200).json();
  } catch (err) {
    next(err)
  }
};

const postEditProduct = async (req, res, next) => {
  const id = req.body.id;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  //catch error
  if (!errors.isEmpty()) {
    if (image) {
      await fileOperator.removeImage(image.path, next);
    }
    return res.status(422).json({
      errorMessage: errors.array()[0].msg,
    });
  }

  try {
    //get product by id
    const targetedProduct = await Product.findProductByID(id);
    if (!targetedProduct.rows[0]) {
      return res.status(404).json({
        errorMessage: "Product not Found",
      });
    }
    const existingImageURL = targetedProduct.rows[0].imageurl;
    const imageURL = image ? image.filename : existingImageURL;
    if (image) {
      const oldImagePath = path.join("images", existingImageURL);
      await fileOperator.removeImage(oldImagePath, next);
    }

    const updatedProduct = new Product(title, imageURL, price, description);
    await Product.editProduct(id, updatedProduct);
    return res.status(200).json({
      successMessage: "Product Updated Successfully!",
    });
  } catch (err) {
    next(err);
  }
};

const removeProduct = async (req, res, next) => {
  const productID = req.params.productID;
  //remove product
  try {
    const selectedProduct = await Product.findProductByID(productID);
    if (selectedProduct.rows.length === 0) {
      return res.redirect("/admin/products");
    }
    const imageURL = path.join("images", selectedProduct.rows[0].imageurl);
    await Product.deleteProduct(productID);
    await fileOperator.removeImage(imageURL, next); // remove image after database execution complete
    //dont re-render the page, use client side json fetching instead
    res.status(200).json({
      message: "success!",
    });
    console.log("Product removed!");
    //remove product failed
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

exports.getAdminPage = getAdminPage
exports.getAddProduct = getAddProduct;
exports.postAddProduct = postAddProduct;
exports.getEditProduct = getEditProduct;
exports.postEditProduct = postEditProduct;
exports.removeProduct = removeProduct;
