//import product model
const Product = require("../model/product");
const fileOperator = require("../util/file");
const { validationResult } = require("express-validator");
const fs = require("fs");
const dirname = require("../util/path");
const path = require("path");
const { pagination } = require("../util/pagination");
const { error } = require("console");

const getAddProduct = (req, res, next) => {
  res.render("../views/admin/add-product.ejs", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    errorMessage: req.flash("error"),
  });
};

const postAddProduct = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;

  if (!image) {
    req.flash("error", "Image Not parsed in!");
    return res.redirect("/admin/add-product");
  }
  console.log(`image path: ${image.path}`);
  const imageURL = image.filename;

  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  //if errors occurs, remove the image file that have been parsed into local
  if (!errors.isEmpty()) {
    //remove replaced image from local
    await fileOperator.removeImage(image.path, next);
    return res.status(422).render("../views/admin/add-product.ejs", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      errorMessage: errors.array()[0].msg,
    });
  }

  try {
    const newProduct = new Product(title, imageURL, price, description);
    await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    if (image) {
      await fileOperator.removeImage(image.path, next)
    }
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const getEditProduct = async (req, res, next) => {
  const productID = req.params.productID;
  try {
    const result = await Product.findProductByID(productID);
    const product = result.rows[0];

    if (!product) {
      console.log("NO PRODUCT");
      return res.redirect("/");
    }

    res.render("../views/admin/edit-product.ejs", {
      currentID: productID,
      currentTitle: product.title,
      currentImageURL: product.imageurl,
      currentPrice: product.price,
      currentDescription: product.description,
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
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
    return res.status(422).render("../views/admin/edit-product.ejs", {
      pageTitle: "Add Product",
      path: "/admin/products",
      errorMessage: errors.array()[0].msg,
    });
  }

  try {
    //get product by id
    const targetedProduct = await Product.findProductByID(id);
    if (!targetedProduct.rows[0]) {
      return res.redirect("/admin/products");
    }
    const existingImageURL = targetedProduct.rows[0].imageurl;
    const imageURL = image ? image.filename : existingImageURL;
    if (image) {
      const oldImagePath = path.join("images", existingImageURL);
      await fileOperator.removeImage(oldImagePath, next);
    }

    const updatedProduct = new Product(title, imageURL, price, description);
    await Product.editProduct(id, updatedProduct);
    return res.redirect("/admin/products");
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const removeProduct = async (req, res, next) => {
  const productID = req.params.productID;
  //remove product
  try {
    const selectedProduct = await Product.findProductByID(productID);
    if (selectedProduct.rows.length === 0) {
      req.flash("error", "Product not found");
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

const getProducts = async (req, res, next) => {
  const productsPerPage = 3;
  await pagination(
    req,
    res,
    productsPerPage,
    "/admin/products",
    async (fetchPage, totalPages) => {
      res.render("../views/admin/admin-product-list.ejs", {
        prods: fetchPage.rows,
        pageTitle: "Admin Product",
        path: "/admin/products",
        totalPages: totalPages,
        errorMessage: req.flash("error"),
      });
    },
  );
};

exports.getAddProduct = getAddProduct;
exports.postAddProduct = postAddProduct;
exports.getProducts = getProducts;
exports.getEditProduct = getEditProduct;
exports.postEditProduct = postEditProduct;
exports.removeProduct = removeProduct;
