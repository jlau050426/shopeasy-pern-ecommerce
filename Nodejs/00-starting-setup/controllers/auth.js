const bcrypt = require("bcrypt");
const db = require("../util/database");
const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const saltRounds = 10;

//send grid transport initialisation
const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY,
  }),
);

const postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  //validation
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: errors.array()[0].msg,
      validationError: errors.array(),
      oldInput: {
        email: email,
      },
    });
  }

  //check database if email and password match
  //check if email exist
  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid Email or Password",
        oldInput: {
          email: email,
        },
      });
    }
    const storedHashPassword = existingUser.rows[0].password;
    const isPasswordMatch = await bcrypt.compare(password, storedHashPassword);

    if (isPasswordMatch) {
      //create a session
      req.session.isLoggedIn = true;
      req.session.sessionUserID = existingUser.rows[0].id;
      req.session.save((err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Session Operation Failed! Internal Server Error",
          });
        }
        return res.status(200).json({
          message: "Login Successful!",
        });
      });
    } else {
      // 3. If the password does not match
      return res.status(401).json({
        message: "Incorrect Email or Password",
        oldInput: {
          email: email,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

const postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    //error occured!
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Unable to log out",
      });
    }
    //log out successfully
    res.clearCookie("connect.sid");
    return res.status(200).json({
      message: "Successfully Log Out",
    });
  });
};

const postSignUp = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  //validation
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      email,
      hashedPassword,
    ]);

    try {
      await transport.sendMail({
        from: "joshua250426.work@gmail.com",
        to: email,
        subject: "Account Creation Success!",
        html: "<h2>Welcome!</h2><p>Your account has been created successfully.</p><p>You can now log in using your email address.</p><p>Thank you,<br>Joshua Store</p>",
      });
    } catch (err) {
      console.error("Failed to send welcome email: ", err);
    }

    return res.status(201).json({
      message: "user created successfully",
      email: email,
    });
  } catch (err) {
    next(err);
  }
};

const getReset = (req, res, next) => {
  res.render("../views/auth/reset-password.ejs", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMessage: req.flash("error"),
  });
};

const postReset = (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("../views/auth/reset-password.ejs", {
      pageTitle: "Reset Password",
      path: "/reset",
      errorMessage: errors.array()[0].msg,
    });
  }

  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    console.log("generated token: ", token);
    // Hash the token using SHA-256
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("generated hashed token: ", hashedToken);

    const expiryTokenDate = Date.now() + 3600000;

    //check if email exist in database
    try {
      const foundUser = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (foundUser.rows.length === 0) {
        req.flash(
          "error",
          "reset link has been sent if the email address is valid",
        );
        return res.redirect("/reset");
      }
      await db.query(
        `UPDATE users
                    SET
                    reset_token_hash = $1,
                    reset_token_expiry = $2
                    WHERE
                    email = $3`,
        [hashedToken, expiryTokenDate, email],
      );

      //send reset password page link through email
      await transport.sendMail({
        from: "joshua250426.work@gmail.com",
        to: email,
        subject: "Reset Password Request",
        html: `
                        <p>You request a password reset</p>
                        <p>Click this <a href="http://localhost:${process.env.PORT}/reset/${token}">link</a> to reset your password</p>
                        `,
      });
      console.log("Reset Email Sent Successfully!");
      return res.redirect("/login");
    } catch (error) {
      const err = new Error(error);
      err.statusCode = 500;
      next(err);
    }
  });
};

const getNewPasswordForm = async (req, res, next) => {
  try {
    const token = req.params.token;
    console.log("params token: ", token);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("get new form hashed token: ", hashedToken);

    const user = await db.query(
      "SELECT id FROM users WHERE reset_token_hash = $1 AND reset_token_expiry > $2",
      [hashedToken, Date.now()],
    );

    if (user.rows.length === 0) {
      req.flash("error", "reset link expired!");
      return res.redirect("/reset");
    }

    const userId = user.rows[0].id;
    res.render("../views/auth/new-password.ejs", {
      pageTitle: "New Password",
      path: "/new-password",
      errorMessage: req.flash("error"),
      token: token,
    });
  } catch (error) {
    console.log(error);
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

const postNewPasswordForm = async (req, res, next) => {
  const token = req.body.token;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    return res.redirect(`/reset/${token}`);
  }

  if (confirmPassword !== newPassword) {
    req.flash("error", "Confirm password does not match!");
    return res.redirect(`/reset/${token}`);
  }
  //insert new password into database
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    //need to double verify the validity
    const user = await db.query(
      `
            SELECT id FROM users 
            WHERE reset_token_hash = $1 
            AND reset_token_expiry > $2`,
      [hashedToken, Date.now()],
    );

    if (user.rows.length === 0) {
      req.flash("error", "Invalid / expired reset link");
      return res.redirect("/reset");
    }

    const userID = user.rows[0].id;
    await db.query(
      `
            UPDATE users 
            SET password = $1, 
            reset_token_hash = NULL, 
            reset_token_expiry = NULL 
            WHERE id = $2
            `,
      [hashedPassword, userID],
    );
    return res.redirect("/login");
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
};

exports.postLogin = postLogin;
exports.postLogout = postLogout;
exports.postSignUp = postSignUp;
exports.getReset = getReset;
exports.postReset = postReset;
exports.getNewPasswordForm = getNewPasswordForm;
exports.postNewPasswordForm = postNewPasswordForm;
