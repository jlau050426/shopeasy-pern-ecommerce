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
    const error = new Error("Invalid File Type");
    error.code = "INVALID_FILE_TYPE";
    cb(error);
  }
};

//multer middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("image");

const uploadImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      // File exceed size limit
      return res.status(413).json({
        errorMessage: "Image exceed size limit. Maximum 5MB",
      });
    } else if (err && err.code === "INVALID_FILE_TYPE") {
      // Invalid file type
      return res.status(422).json({
        errorMessage: "Invalid File Type. Allowed: (JPG, PNG, JPEG)",
      });
    } else if (err) {
      return next(err);
    }

    //upload succeed
    next();
  });
};

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  isAdmin,
  blockProductDuringPayment,
  verifyCsrfToken,
  uploadImage,
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price")
      .isFloat({ min: 1, max: 99999 })
      .withMessage("Price must be a decimal (1 - 99999)")
      .toFloat(),
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
  uploadImage,
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Min 3 Characters"),
    body("price")
      .isFloat({ min: 1, max: 99999 })
      .withMessage("Price must be a decimal (1 - 99999)")
      .toFloat(),
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
