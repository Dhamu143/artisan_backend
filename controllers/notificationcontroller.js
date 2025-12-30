const User = require("../models/userModel");
const admin = require("../firebase");

// --- Helper: Ensure all data values are Strings (Firebase Requirement) ---
const safeStringifyData = (data = {}) => {
  return Object.keys(data).reduce((acc, key) => {
    acc[key] = String(data[key] || "");
    return acc;
  }, {});
};

exports.sendPushNotification = async (
  token,
  title,
  body,
  data = {},
  tag = null,
  messageHistory = [],
  unreadCount = 1,
  findArtisan = false
) => {
  try {
    if (!token) return;

    // console.log("👉 Sending FCM to Token:", token);

    const combinedData = {
      ...data,
      messageHistory: JSON.stringify(messageHistory),
      unreadCount: String(unreadCount),
      findArtisan: findArtisan ? "true" : "false",
    };

    // Ensure data payload is purely strings
    const safeData = safeStringifyData(combinedData);

    const messagePayload = {
      token,
      notification: { title, body },
      data: safeData,
    };

    // Android Config
    if (tag) {
      messagePayload.android = {
        notification: {
          tag: tag,
          clickAction: "CHAT_ACTIVITY",
          notificationCount: Number(unreadCount), // Must be Number for System Badge
        },
      };
    }

    // iOS Config
    if (tag) {
      messagePayload.apns = {
        payload: {
          aps: {
            "thread-id": tag,
            badge: Number(unreadCount), // Must be Number for System Badge
          },
        },
      };
    }

    await admin.messaging().send(messagePayload);
    console.log(`🔔 FCM Sent | Tag: ${tag} | Count: ${unreadCount}`);
  } catch (err) {
    console.error("❌ FCM Error:", err.message);
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
    // console.log("pushNotificationToken ", token);

    const safeData = safeStringifyData(data);

    const response = await admin.messaging().send({
      token,
      notification: { title, body },
      data: safeData,
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

    const safeData = safeStringifyData(data);

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: safeData,
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

    const allTokens = users.map((u) => u.pushNotificationToken).filter(Boolean);

    if (!allTokens.length)
      return res.json({ success: false, message: "No tokens found" });

    const safeData = safeStringifyData(data);

    // --- BATCHING LOGIC (Critical for Scale) ---
    // Firebase limits sendEachForMulticast to 500 tokens per batch
    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batchTokens = allTokens.slice(i, i + batchSize);
      batches.push(
        admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          notification: { title, body },
          data: safeData,
        })
      );
    }

    const results = await Promise.all(batches);

    // Aggregate results
    let successCount = 0;
    let failureCount = 0;

    results.forEach((r) => {
      successCount += r.successCount;
      failureCount += r.failureCount;
    });

    return res.json({
      success: true,
      totalTargets: allTokens.length,
      sent: successCount,
      failed: failureCount,
    });
  } catch (err) {
    console.error("Send all error:", err);
    return res.status(500).json({ message: "Send to all failed" });
  }
};
