//imports
const express = require("express");
const { body } = require("express-validator");
const multer = require("multer"); //image uploads
const { IMAGES_DIR } = require("../util/folders");

const router = express.Router();

//imports controllers
const adminController = require("../controllers/admin");

//imports middleware
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const verifyCsrfToken = require("../middleware/verifyCsrfToken");
const blockProductDuringPayment = require("../middleware/blockProductDuringPayement");

//multer file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR); //retrieve file from /images folder
  },

  filename: (req, file, cb) => {
    const date = new Date().toISOString().replace(/:/g, "-");
    const fileName = file.originalname;
    cb(null, `${date}${fileName}`); // the file will be named as date-fileName.png/.jpg.jpeg
  },
});

//multer file filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    // To accept the file pass `true`, like so:
    cb(null, true);
  } else {
    // To reject this file pass `false`, like so:
    cb(null, false);
  }
};

//multer middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024, // 5MB
  },
}).single("image");

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  isAdmin,
  blockProductDuringPayment,
  verifyCsrfToken,
  upload,
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price").isFloat().toFloat(),
    body("description")
      .isLength({ min: 6 })
      .withMessage("Min 6 characters")
      .trim(),
  ],
  adminController.postAddProduct,
);

router.get(
  "/add-product",
  isAuth,
  isAdmin,
  blockProductDuringPayment,
  adminController.getAddProduct,
);
router.get("/admin-page", isAuth, isAdmin, adminController.getAdminPage);

// /admin/edit-product ==> get
router.get(
  "/edit-product/:productID",
  isAuth,
  isAdmin,
  blockProductDuringPayment,
  adminController.getEditProduct,
);

router.post(
  "/edit-product",
  isAuth,
  isAdmin,
  verifyCsrfToken,
  blockProductDuringPayment,
  upload,
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price").isFloat().toFloat(),
    body("description")
      .isLength({ min: 6 })
      .withMessage("Min 6 characters")
      .trim(),
  ],
  adminController.postEditProduct,
);

//delete
router.delete(
  "/delete-product/:productID",
  isAuth,
  isAdmin,
  verifyCsrfToken,
  blockProductDuringPayment,
  adminController.removeProduct,
);

module.exports = router;
