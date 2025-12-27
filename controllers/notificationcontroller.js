const User = require("../models/userModel");
const admin = require("../firebase");

// exports.sendPushNotification = async (token, title, body, data = {}) => {
//   try {
//     if (!token) return;

//     const safeData = Object.keys(data).reduce((acc, key) => {
//       acc[key] = String(data[key] || "");
//       return acc;
//     }, {});

//     await admin.messaging().send({
//       token,
//       notification: { title, body },
//       data: safeData,
//     });
//     console.log("🔔 Push notification sent successfully");
//   } catch (err) {
//     console.error("❌ FCM Notification Error:", err.message);
//   }
// };

exports.sendPushNotification = async (
  token,
  title,
  body,
  data = {},
  tag = null,
  messageHistory = [],
  unreadCount = 1
) => {
  try {
    if (!token) return;

    const combinedData = {
      ...data,
      messageHistory: JSON.stringify(messageHistory),
      unreadCount: String(unreadCount),
    };

    const safeData = Object.keys(combinedData).reduce((acc, key) => {
      acc[key] = String(combinedData[key] || "");
      return acc;
    }, {});

    const messagePayload = {
      token,
      notification: { title, body },
      data: safeData,
    };
    console.log("messagePayload", messagePayload);
    if (tag) {
      messagePayload.android = {
        notification: {
          tag: tag,
          clickAction: "CHAT_ACTIVITY",
          notificationCount: unreadCount,
        },
      };
    }

    if (tag) {
      messagePayload.apns = {
        payload: {
          aps: {
            "thread-id": tag,
            badge: unreadCount,
          },
        },
      };
    }

    await admin.messaging().send(messagePayload);
    console.log("🔔 Grouped Notification Sent | Count:", unreadCount);
  } catch (err) {
    console.error("❌ FCM Notification Error:", err.message);
  }
};

exports.sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findById(userId).select(
      "pushNotificationToken name"
    );

    if (!user || !user.pushNotificationToken)
      return res.json({ success: false, message: "User has no FCM token" });

    const token = user.pushNotificationToken;

    const response = await admin.messaging().send({
      token,
      notification: { title, body },
      data: data || {},
    });

    return res.json({ success: true, messageId: response });
  } catch (err) {
    console.error("FCM send error:", err);
    return res.status(500).json({ message: "Notification send failed" });
  }
};

exports.sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds?.length || !title || !body)
      return res.status(400).json({ message: "Missing fields" });

    const users = await User.find({ _id: { $in: userIds } }).select(
      "pushNotificationToken"
    );

    const tokens = users.map((u) => u.pushNotificationToken).filter(Boolean);

    if (!tokens.length)
      return res.json({ success: false, message: "No valid tokens found" });

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
    });

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (err) {
    console.error("Bulk FCM error:", err);
    return res.status(500).json({ message: "Bulk notification failed" });
  }
};

exports.sendToAllUsers = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body)
      return res.status(400).json({ message: "Missing fields" });

    const users = await User.find({
      pushNotificationToken: { $exists: true, $ne: "" },
    }).select("pushNotificationToken");

    const tokens = users.map((u) => u.pushNotificationToken);

    if (!tokens.length)
      return res.json({ success: false, message: "No tokens found" });

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
    });

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (err) {
    console.error("Send all error:", err);
    return res.status(500).json({ message: "Send to all failed" });
  }
};
