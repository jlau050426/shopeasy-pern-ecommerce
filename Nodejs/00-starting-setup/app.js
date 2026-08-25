//imports
require("dotenv").config(); //env file imports
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const crypto = require("crypto");
const flash = require("connect-flash");
const multer = require("multer"); //image uploads

//multer file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/"); //create a directory called images on local to retrieve file
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

//initialise express app
const app = express();
//initialise port
const PORT = process.env.PORT;

app.set("view engine", "ejs");
app.set("views", "views");

//imports route
const adminRoute = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//import controller (404error)
const errorController = require("./controllers/error");

//import shopController for webhook
const shopController = require('./controllers/shop')

//stripe webhook require raw request body, need to define before express.json
router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  shopController.stripeWebhook,
);

//import middleware
const verifyCsrfToken = require("./middleware/verifyCsrfToken");

//bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false })); //submit url-form-data
// JSON bodyParser
app.use(express.json());

//multer middleware
app.use(
  multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }).single("image"),
);

//static file
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

//initiating session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents XSS` script access to session cookie
      sameSite: "lax", // Layer 1 CSRF Protection: Protects against cross-site POST requests
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

//assign tokens for every sessions
//res.locals.csrfToken is used to pass the token to the views
app.use((req, res, next) => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.isAuthenticated = req.session.isLoggedIn || false;
  res.locals.csrfToken = req.session.csrfToken || null; // res.locals.csrfToken is req.session.csrfToken is token is initialized
  next();
});
// app.use(verifyCsrfToken)

//error flash middleware
app.use(flash());

//router middleware
//concatenate every address behind /admin
app.use("/admin", adminRoute);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", errorController.error500);
app.use(errorController.error404);

//error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  res.redirect("/500");
});

//start the app
app.listen(PORT, () => {
  console.log("App Started on PORT", PORT);
});
