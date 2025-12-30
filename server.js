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
// require("./config/passport")(passport); // Import passport config

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminAuthRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const professionRouter = require("./routes/professionrouter");
const adminDashboardRoutes = require("./routes/adminDashboardRouters");
const faqRoutes = require("./routes/faqRoutes");
const profileViewRouter = require("./routes/profileViewRouter");
// const googleAuthRoute = require("./routes/googleAuthRoute");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const chatSocket = require("./socket/chatSocket");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

chatSocket(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/professions", professionRouter);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api", profileViewRouter);
// app.use("/api", googleAuthRoute); 
app.use("/api", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running.");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
