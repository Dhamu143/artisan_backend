const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
console.log("Signing with Secret:", process.env.JWT_SECRET);

exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res
        .status(403)
        .json({ message: "Admin already exists. Login instead." });
    }

    const admin = await Admin.create({ email, password });

    res.status(201).json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
      message: "Admin registered successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Error registering admin",
      error: error.message,
    });
  }
};

// Login admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
      message: "Admin login successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
  res.status(200).json({
    _id: req.admin._id,
    email: req.admin.email,
    role: req.admin.role,
  });
};
