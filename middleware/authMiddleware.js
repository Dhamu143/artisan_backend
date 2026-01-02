const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  console.log("\n================ AUTH MIDDLEWARE START ================");

  const header = req.headers.authorization;
  console.log("📥 Authorization Header:", header);

  if (!header) {
    console.log("❌ Token missing");
    console.log("================ AUTH MIDDLEWARE END =================\n");
    return res.status(401).json({ error: "Token missing" });
  }

  const token = header.split(" ")[1];
  console.log("🔑 Extracted Token:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("🧾 Decoded Token:", decoded);

    const user = await User.findById(decoded.userId).select("_id");
    console.log("👤 DB User Lookup:", user);

    if (!user) {
      console.log("❌ User not found");
      console.log("================ AUTH MIDDLEWARE END =================\n");
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { userId: user._id.toString() };
    console.log("✅ Authenticated User ID:", req.user.userId);

    console.log("================ AUTH MIDDLEWARE END =================\n");
    next();
  } catch (err) {
    console.log("❌ TOKEN VERIFY ERROR:", err.message);
    console.log("================ AUTH MIDDLEWARE END =================\n");
    return res.status(401).json({ error: "Invalid token" });
  }
};
