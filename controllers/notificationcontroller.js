const User = require("../models/userModel");
const admin = require("../firebase");

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
    if (!token) {
      console.log("⚠️ Skipping push — empty token");
      return;
    }

    console.log("📨 Preparing Push Notification", {
      title,
      body,
      tokenPreview: token.slice(0, 12) + "...",
      unreadCount,
      hasMessageHistory: Boolean(messageHistory?.length),
    });

    const combinedData = {
      ...data,
      messageHistory: JSON.stringify(messageHistory),
      unreadCount: String(unreadCount),
      findArtisan: findArtisan ? "true" : "false",
    };

    const safeData = safeStringifyData(combinedData);

    const messagePayload = {
      token,
      notification: { title, body },
      data: safeData,
    };

    console.log("📦 Payload Data Keys", Object.keys(safeData));

    if (tag) {
      messagePayload.android = {
        notification: {
          tag,
          clickAction: "CHAT_ACTIVITY",
          notificationCount: Number(unreadCount),
        },
      };

      messagePayload.apns = {
        payload: {
          aps: {
            "thread-id": tag,
            badge: Number(unreadCount),
          },
        },
      };
    }

    console.log("🚀 Sending FCM Message", {
      tag,
      unreadCount,
    });

    await admin.messaging().send(messagePayload);

    console.log(`✅ Push Sent | Tag=${tag} | Count=${unreadCount}`);
  } catch (err) {
    console.error("❌ FCM Error:", {
      message: err.message,
      code: err.code,
    });
  }
};

exports.sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    console.log("📨 Notification request received", {
      userId,
      title,
      hasBody: Boolean(body),
      hasData: Boolean(data),
    });

    if (!userId || !title || !body) {
      console.log("⚠️ Missing required fields");
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findById(userId).select(
      "pushNotificationToken name"
    );

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.pushNotificationToken) {
      console.log(
        "⚠️ User has no FCM token — skipping send:",
        userId,
        user.name
      );
      return res.json({ success: false, message: "User has no FCM token" });
    }

    const token = user.pushNotificationToken;

    console.log("📌 Sending notification to:", {
      userId: user._id,
      userName: user.name,
      tokenPreview: token.slice(0, 12) + "...",
    });

    const safeData = safeStringifyData(data);

    const payload = {
      token,
      notification: { title, body },
      data: safeData,
    };

    console.log("🚀 FCM payload prepared", {
      title,
      body,
      dataKeys: Object.keys(safeData || {}),
    });

    const response = await admin.messaging().send(payload);

    console.log("✅ Notification sent successfully", {
      userId: user._id,
      messageId: response,
    });

    return res.json({ success: true, messageId: response });
  } catch (err) {
    console.error("❌ FCM send error", {
      message: err.message,
      code: err.code,
      stack: err.stack?.split("\n")[0],
    });

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
exports.sendJobNotificationToArtisans = async (req, res) => {
  try {
    const { categoryId, title, body, data, excludeUserId } = req.body;

    // 1. Validate Input
    if (!categoryId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: categoryId, title, or body"
      });
    }

    console.log(`📨 Finding artisans for Category: ${categoryId}`);

    const query = {
      findArtisan: false,
      categoryId: categoryId,
      pushNotificationToken: { $exists: true, $ne: "" },
    };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const artisans = await User.find(query).select("pushNotificationToken");

    const tokens = artisans.map((u) => u.pushNotificationToken).filter(Boolean);

    if (!tokens.length) {
      console.log("⚠️ No matching artisans found for notification.");
      return res.json({
        success: true,
        message: "No artisans found in this category",
        sent: 0
      });
    }

    console.log(`🎯 Found ${tokens.length} artisans to notify.`);

    const safeData = safeStringifyData(data);

    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);

      batches.push(
        admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          notification: { title, body },
          data: safeData,
        })
      );
    }

    const results = await Promise.all(batches);

    let successCount = 0;
    let failureCount = 0;

    results.forEach((r) => {
      successCount += r.successCount;
      failureCount += r.failureCount;
    });

    console.log(`✅ Job Notification Sent: Success=${successCount}, Failed=${failureCount}`);

    return res.json({
      success: true,
      totalTargets: tokens.length,
      sent: successCount,
      failed: failureCount,
    });

  } catch (err) {
    console.error("❌ Send Job Notification Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: err.message
    });
  }
};