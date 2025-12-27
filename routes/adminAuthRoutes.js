const express = require("express");
const router = express.Router();

const { loginAdmin } = require("../controllers/adminController");

const { protect } = require("../middleware/adminMiddleware");

router.post("/login", loginAdmin);

module.exports = router;
