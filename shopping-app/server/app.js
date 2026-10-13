//imports
const path = require("path");
const dotenvFilePath = path.join(__dirname, ".env");
require("dotenv").config({ path: dotenvFilePath }); //env file imports
const express = require("express");
const session = require("express-session");
const { Server } = require("socket.io");
const http = require("node:http");
const cors = require("cors");
const helmet = require("helmet");
const { IMAGES_DIR } = require("./util/folders");
const database = require("./util/database"); //for session store
const pgSessionStore = require("connect-pg-simple")(session);

//imports route
const adminRoute = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//import controller (404error)
const errorController = require("./controllers/error");

//import shopController for webhook
const shopController = require("./controllers/shop");

//initialise express app
const app = express();
//create a server that held express app
const server = http.createServer(app);

app.use(helmet());

//initialise port
const PORT = process.env.PORT;

//stripe webhook require raw request body, need to define before express.json
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  shopController.stripeWebhook,
);

//CORS header
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  }),
);

app.use(express.json());

//static file
app.use(
  express.static(IMAGES_DIR, {
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

//initiating session
const sessionMiddleware = session({
  store: new pgSessionStore({
    pool: database,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents XSS` script access to session cookie
    sameSite: "lax", // Layer 1 CSRF Protection: Protects against cross-site POST requests
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

app.use(sessionMiddleware);

// THIS IS EJS APPROACH React do not have res.loacls approach
//assign tokens for every sessions
//res.locals.csrfToken is used to pass the token to the views
// app.use((req, res, next) => {
//   if (req.session && !req.session.csrfToken) {
//     req.session.csrfToken = crypto.randomBytes(32).toString("hex"); //csrf token generation
//   }
//   res.locals.isAuthenticated = req.session.isLoggedIn || false;
//   res.locals.csrfToken = req.session.csrfToken || null; // res.locals.csrfToken is req.session.csrfToken is token is initialized
//   next();
// });

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
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  },
});

//let socket.io server to share the same session
io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  const sessionUserID = socket.request.session.sessionUserID;
  const userRole = socket.request.session.sessionUserRole;
  console.log("");
  console.log("--------------socket information --------------");

  if (!sessionUserID) {
    console.log("User as GUEST");
    return;
  } else if (userRole === "ADMIN") {
    console.log("User as ADMIN");
    console.log(`Admin ${sessionUserID} role ${userRole} connected`);
    socket.join(`user-${sessionUserID}`); //admin will join two different room
    socket.join(`admin-${sessionUserID}`);
    console.log(`Admin ${sessionUserID} join room admin-${sessionUserID}`);
  } else {
    console.log("User as USER");
    console.log(`User ${sessionUserID} role ${userRole} connected`);
    socket.join(`user-${sessionUserID}`);
    console.log(`User ${sessionUserID} join room user-${sessionUserID}`);
  }

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.set("io", io);

//start the app
server.listen(PORT, () => {
  console.log("Server listen on PORT", PORT);
});
