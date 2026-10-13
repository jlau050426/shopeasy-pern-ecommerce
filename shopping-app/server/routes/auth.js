//imports
const path = require("path");
const express = require("express");
const router = express.Router();
const db = require("../util/database");
const authController = require("../controllers/auth");
const { body } = require("express-validator");
const verifyCsrfToken = require("../middleware/verifyCsrfToken");

//log in route
router.post(
  "/login",
  verifyCsrfToken,
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
    body("password").trim(),
  ],
  authController.postLogin,
);

//logout route
router.post("/logout", verifyCsrfToken, authController.postLogout);

//sign up route
router.post(
  "/sign-up",
  verifyCsrfToken,
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email!")
      .normalizeEmail()
      .custom(async (email) => {
        const existingUser = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email],
        );
        if (existingUser.rows.length > 0) {
          return Promise.reject("User already exist! Try log in!");
        }
      }),
    body(
      "password",
      "Password must be at least 6 characters long and contain only letters and numbers.",
    )
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric(),
    body("confirmPassword")
      .trim()
      .custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
          throw new Error("Passwords do not match.");
        }
        return true;
      }),
  ],
  authController.postSignUp,
);

// /reset route
router.post(
  "/reset",
  verifyCsrfToken,
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
  ],
  authController.postReset,
);
router.post(
  "/new-password",
  verifyCsrfToken,
  [
    body(
      "newPassword",
      "password must be at least 6 characters and contain only letters and numbers",
    )
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric(),
    body("confirmPassword").trim(),
  ],
  authController.postNewPasswordForm,
);

//get CSRF tokens
router.get("/csrf-token", authController.getCsrf);

router.get("/check-admin", authController.checkIsAdmin);
module.exports = router;
