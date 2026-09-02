//imports
require("dotenv").config(); //env file imports
const path = require("path");
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const { Server } = require("socket.io");
const http = require("node:http");

const cors = require("cors");

//initialise express app
const app = express();

const server = http.createServer(app);

//initialise port
const PORT = process.env.PORT;

//CORS header
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "csrf-token"],
  }),
);

//imports route
const adminRoute = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//import controller (404error)
const errorController = require("./controllers/error");

//import shopController for webhook
const shopController = require("./controllers/shop");

//stripe webhook require raw request body, need to define before express.json
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  shopController.stripeWebhook,
);

//import middleware
const verifyCsrfToken = require("./middleware/verifyCsrfToken");

app.use(express.json());

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
  res.status(500).json({
    message: "Internal Server Error", //just show internal server error everytime
  });
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "csrf-token"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.set("io", io);

//start the app
server.listen(PORT, () => {
  console.log("Server listen on PORT", PORT);
});
