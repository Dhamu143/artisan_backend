const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== "admin") {
        return res.status(403).json({
          error: "Forbidden: Token is not for an Administrator.",
          issuccess: false,
        });
      }
      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
        return res.status(401).json({
          error: "Not authorized: Administrator not found.",
          issuccess: false,
        });
      }

      req.admin = admin;

      next();
    } catch (error) {
      console.error("Admin token verification error:", error.message);
      return res.status(401).json({
        error: "Not authorized: Invalid or expired token.",
        issuccess: false,
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      error: "Not authorized: No authentication token provided.",
      issuccess: false,
    });
  }
};

module.exports = { protectAdmin };
