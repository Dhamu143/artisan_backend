const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  console.log("\n================ AUTH MIDDLEWARE START ================");

  // Log secret diagnostics — safe but useful
  console.log("🔐 JWT Secret Status:", {
    exists: Boolean(JWT_SECRET),
    length: JWT_SECRET ? JWT_SECRET.length : 0,
  });

  if (!JWT_SECRET) {
    console.log("❌ JWT_SECRET is NOT set in environment");
    console.log("================ AUTH MIDDLEWARE END =================\n");
    return res.status(500).json({ error: "Server JWT config missing" });
  }

  // Log header
  const header = req.headers.authorization;
  console.log("📥 Authorization Header:", header);

  if (!header) {
    console.log("❌ Token missing");
    console.log("================ AUTH MIDDLEWARE END =================\n");
    return res.status(401).json({ error: "Token missing" });
  }

  // Support both "Bearer <token>" and "<token>"
  const parts = header.split(" ");
  const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : header;

  console.log(
    "🔑 Extracted Token (first 25 chars):",
    token?.slice(0, 25) + "..."
  );

  try {
    console.log("🟡 Verifying token with JWT_SECRET...");
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("🧾 Token Decoded:", {
      userId: decoded?.userId,
      mobile: decoded?.mobile,
      iat: decoded?.iat,
      exp: decoded?.exp,
    });

    console.log("📡 Fetching user from DB...");
    const user = await User.findById(decoded.userId).select("_id");

    console.log("👤 DB Lookup Result:", user);

    if (!user) {
      console.log("❌ User not found in DB");
      console.log("================ AUTH MIDDLEWARE END =================\n");
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { userId: user._id.toString() };

    console.log("✅ Authenticated User:", req.user.userId);
    console.log("================ AUTH MIDDLEWARE END =================\n");

    next();
  } catch (err) {
    console.log("❌ TOKEN VERIFY ERROR");
    console.log("   • Message:", err.message);
    console.log("   • Name:", err.name);

    if (err.expiredAt) {
      console.log("   • Expired At:", err.expiredAt);
    }

    console.log("================ AUTH MIDDLEWARE END =================\n");

    return res.status(401).json({ error: "Invalid token" });
  }
};
