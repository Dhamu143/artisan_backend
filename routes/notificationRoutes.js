const express = require("express");
const {
  sendNotificationToUser,
  sendBulkNotifications,
  sendToAllUsers
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/admin/send-notification", sendNotificationToUser);
router.post("/admin/send-bulk", sendBulkNotifications);
router.post("/admin/send-all", sendToAllUsers);

module.exports = router;
