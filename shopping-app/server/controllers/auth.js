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
      req.session.sessionUserRole = existingUser.rows[0].role;
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
  const io = req.app.get("io")
  const sessionUserID = req.session.sessionUserID
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
    io.to(`user-${sessionUserID}`).emit("auth:logout")
    return res.status(200).json({
      message: "Successfully Log Out",
    });
  });
};

const postSignUp = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const adminPasskey = req.body.adminInvitationCode?.trim();
  const errors = validationResult(req);

  let role = "USER";
  if (adminPasskey) {
    if (adminPasskey === "secret-passkey") {
      role = "ADMIN";
    }else{
      return res.status(422).json({
        message: "Invalid admin invitation code",
        oldInput: {
          email: email
        },
      })
    }
  }

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
    await db.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
      [email, hashedPassword, role],
    );

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

const postReset = (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: errors.array()[0].msg,
    });
  }

  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return next(err); //error middleware will assign 500 status code
    }
    const token = buffer.toString("hex");
    // Hash the token using SHA-256
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const expiryTokenDate = Date.now() + 3600000;

    //check if email exist in database
    try {
      const foundUser = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (foundUser.rows.length === 0) {
        return res.status(200).json({
          message: "reset link has been sent if the email address is valid",
        });
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
              <p>Click this <a href="http://localhost:5173/set-new-password/${token}">link</a> to reset your password</p>
              `,
      });
      return res.status(200).json({
        message: "reset link has been sent if the email address is valid",
      });
    } catch (err) {
      next(err);
    }
  });
};

const postNewPasswordForm = async (req, res, next) => {
  const token = req.body.token;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: errors.array()[0].msg,
    });
  }

  if (confirmPassword !== newPassword) {
    return res.status(422).json({
      message: "Confirm password does not match!",
    });
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
      return res.status(400).json({
        message: "Invalid / expired reset link",
      });
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
    return res.status(201).json({
      message: "New Password Updated!",
    });
  } catch (err) {
    next(err);
  }
};

const checkIsAdmin = (req, res, next) => {

  //check is logged in first
  //check isAdmin
  //return as user

  if (!req.session.isLoggedIn) {
    return res.status(401).json({
      errorMessage: "Log In for More Details"
    })
  }

  if (req.session.sessionUserRole === "ADMIN") {
    return res.status(200).json({
      successMessage: "Welcome Admin"
    })
  }

  return res.status(403).json({
    successMessage: "Welcome User"
  })
}

exports.postLogin = postLogin;
exports.postLogout = postLogout;
exports.postSignUp = postSignUp;
exports.postReset = postReset;
exports.postNewPasswordForm = postNewPasswordForm;
exports.checkIsAdmin = checkIsAdmin
