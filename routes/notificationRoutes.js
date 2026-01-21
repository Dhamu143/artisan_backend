const express = require("express");
const {
  sendNotificationToUser,
  sendBulkNotifications,
  sendToAllUsers,
  sendJobNotificationToArtisans
} = require("../controllers/notificationcontroller");

const router = express.Router();

router.post("/admin/send-notification", sendNotificationToUser);
router.post("/admin/send-bulk", sendBulkNotifications);
router.post("/admin/send-all", sendToAllUsers);
router.post("/send-job-alert", sendJobNotificationToArtisans);
module.exports = router;
