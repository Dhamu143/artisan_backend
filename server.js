console.log("server running");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
// require("./controllers/premiumReminderJob");

dotenv.config();

const app = express();

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
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
})();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

require("./socket/chatSocket")(io);

app.get("/", (req, res) => res.send("Backend Running."));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
