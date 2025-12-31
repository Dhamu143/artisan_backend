console.log("server running");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");

dotenv.config();

const app = express();

/* IMPORTANT for Render reverse proxy */
app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.ADMIN_JWT_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true ONLY when your frontend is HTTPS + same domain
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ---------- DB ---------- */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
})();

/* ---------- HTTP + SOCKET SERVER ---------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  transports: ["websocket", "polling"], // Render fix
  allowEIO3: true, // compatibility
});

/* load chat handlers */
require("./socket/chatSocket")(io);

/* ---------- ROUTES ---------- */
app.get("/", (req, res) => res.send("Backend Running."));

// your routes…
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminAuthRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/professions", require("./routes/professionrouter"));
app.use("/api/admin-dashboard", require("./routes/adminDashboardRouters"));
app.use("/api/faqs", require("./routes/faqRoutes"));
app.use("/api", require("./routes/profileViewRouter"));
app.use("/api", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

/* ---------- PORT ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

// console.log("server running");

// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// dotenv.config();

// const mongoose = require("mongoose");

// const http = require("http");
// const { Server } = require("socket.io");

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/adminAuthRoutes");
// const uploadRoutes = require("./routes/uploadRoutes");
// const ratingRoutes = require("./routes/ratingRoutes");
// const professionRouter = require("./routes/professionrouter");
// const adminDashboardRoutes = require("./routes/adminDashboardRouters");
// const faqRoutes = require("./routes/faqRoutes");
// const profileViewRouter = require("./routes/profileViewRouter");
// const googleAuthRoute = require("./routes/googleAuthRoute");
// const notificationRoutes = require("./routes/notificationRoutes");
// const chatRoutes = require("./routes/chatRoutes");
// const chatSocket = require("./socket/chatSocket");

// const app = express();

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// };
// connectDB();

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   },
// });

// chatSocket(io);

// app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/ratings", ratingRoutes);
// app.use("/api/professions", professionRouter);
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/faqs", faqRoutes);
// app.use("/api", profileViewRouter);
// app.use("/api", googleAuthRoute);
// app.use("/api", notificationRoutes);
// app.use("/api/chat", chatRoutes);

// app.get("/", (req, res) => {
//   res.send("Backend Running.");
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
