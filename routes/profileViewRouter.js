const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  trackProfileView,
  getProfileViewCount,
} = require("../controllers/profileController");

router.post("/profile-view", authMiddleware, trackProfileView);
router.get("/profile-view/count/:profileUserId", getProfileViewCount);

module.exports = router;
