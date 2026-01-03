const mongoose = require("mongoose");
const ProfileView = require("../models/profileViewModel");
const User = require("../models/userModel");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

exports.trackProfileView = async (req, res) => {
  console.log("\n================ PROFILE VIEW START ================");

  try {
    const { profileUserId } = req.body;
    const viewerUserId = req.user?.userId;

    console.log("📥 Incoming Request Body:", req.body);
    console.log("👤 Viewer User ID (from token):", viewerUserId);

    if (!profileUserId || !viewerUserId) {
      console.log("❌ Missing profileUserId or viewerUserId");
      return res.status(400).json({ message: "Invalid request" });
    }

    // Prevent self-view
    if (profileUserId === viewerUserId) {
      console.log("⚠️ Self profile view detected — skipping");
      return res.status(200).json({ viewed: false });
    }

    console.log("🔍 Checking existing profile view...");

    const result = await ProfileView.updateOne(
      {
        profileUserId: new mongoose.Types.ObjectId(profileUserId),
        viewerUserId: new mongoose.Types.ObjectId(viewerUserId),
      },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    console.log("🗄 MongoDB updateOne result:", {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    });

    // Already viewed
    if (result.matchedCount > 0) {
      console.log("ℹ️ Profile already viewed earlier — no notification");
      console.log("================ PROFILE VIEW END =================\n");
      return res.status(200).json({ viewed: false });
    }

    console.log("✅ First-time profile view detected");

    // Fetch users
    console.log("📡 Fetching viewer & profile owner data...");
    const viewer = await User.findById(viewerUserId).select("name");
    const profileUser = await User.findById(profileUserId).select(
      "name pushNotificationToken"
    );

    console.log("👀 Viewer:", viewer);
    console.log("🧑 Profile Owner:", {
      name: profileUser?.name,
      hasPushToken: Boolean(profileUser?.pushNotificationToken),
    });

    if (profileUser?.pushNotificationToken) {
      const title = "Profile viewed 👀";
      const body = `${viewer?.name || "Someone"} viewed your profile`;

      const payloadData = {
        type: "PROFILE_VIEW",
        profileUserId: profileUserId.toString(),
        viewerUserId: viewerUserId.toString(),
      };

      console.log("📨 Sending push notification...");
      console.log("📦 Payload:", payloadData);

      await sendPushNotification(
        profileUser.pushNotificationToken,
        title,
        body,
        payloadData,
        null,
        [],
        1
      );

      console.log("🔔 Push notification sent successfully");
    } else {
      console.log("⚠️ No pushNotificationToken — notification skipped");
    }

    console.log("🎉 Profile view recorded successfully");
    console.log("================ PROFILE VIEW END =================\n");

    return res.status(200).json({
      viewed: true,
      issuccess: true,
      message: "Profile view counted",
    });
  } catch (error) {
    console.error("❌ PROFILE VIEW ERROR:", error);
    console.log("================ PROFILE VIEW FAILED ===============\n");
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getProfileViewCount = async (req, res) => {
  console.log("\n================ FETCH VIEW COUNT =================");

  try {
    const { profileUserId } = req.params;

    console.log("📥 Params:", req.params);

    if (!profileUserId) {
      console.log("❌ Missing profileUserId");
      return res.status(400).json({ message: "Invalid request" });
    }

    const count = await ProfileView.countDocuments({
      profileUserId: new mongoose.Types.ObjectId(profileUserId),
    });

    console.log("📊 Total Profile Views:", count);
    console.log("================ FETCH VIEW COUNT END =============\n");

    return res.status(200).json({
      profileUserId,
      totalViews: count,
      issuccess: true,
    });
  } catch (error) {
    console.error("❌ PROFILE VIEW COUNT ERROR:", error);
    console.log("================ FETCH VIEW COUNT FAILED ===========\n");
    return res.status(500).json({ message: "Server error" });
  }
};
