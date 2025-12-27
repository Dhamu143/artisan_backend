const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token missing" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select("_id");
    if (!user) return res.status(401).json({ error: "User not found" });

    // 🔑 IMPORTANT: keep userId key
    req.user = {
      userId: user._id.toString(),
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
