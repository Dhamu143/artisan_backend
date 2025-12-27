const express = require("express");
const router = express.Router();

const { getFullDashboardData } =
  require("../controllers/adminDashboardController");

router.get("/counts", getFullDashboardData);

module.exports = router;
