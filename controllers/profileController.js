// const ProfileView = require("../models/profileViewModel");
// const mongoose = require("mongoose");

// exports.trackProfileView = async (req, res) => {
//   try {
//     const { profileUserId } = req.body;
//     const viewerUserId = req.user.userId;

//     console.log("PROFILE:", profileUserId);
//     console.log("VIEWER:", viewerUserId);

//     if (profileUserId === viewerUserId) {
//       return res.status(200).json({ viewed: false });
//     }

//     const result = await ProfileView.updateOne(
//       {
//         profileUserId: new mongoose.Types.ObjectId(profileUserId),
//         viewerUserId: new mongoose.Types.ObjectId(viewerUserId),
//       },
//       { $setOnInsert: {} },
//       { upsert: true }
//     );

//     if (result.matchedCount > 0) {
//       return res.status(200).json({ viewed: false });
//     }

//     return res.status(200).json({
//       viewed: true,
//       issuccess: true,
//       message: "Profile view counted",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getProfileViewCount = async (req, res) => {
//   try {
//     const { profileUserId } = req.params;

//     const count = await ProfileView.countDocuments({
//       profileUserId: new mongoose.Types.ObjectId(profileUserId),
//     });

//     return res.status(200).json({
//       profileUserId,
//       totalViews: count,
//       issuccess: true,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error" });
//   }
// };

const mongoose = require("mongoose");
const ProfileView = require("../models/profileViewModel");
const User = require("../models/userModel");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

exports.trackProfileView = async (req, res) => {
  try {
    const { profileUserId } = req.body;
    const viewerUserId = req.user.userId;

    console.log("---- 👁 PROFILE VIEW EVENT ----");
    console.log("Profile Owner (profileUserId):", profileUserId);
    console.log("Viewer (viewerUserId):", viewerUserId);

    // Prevent self-view
    if (profileUserId === viewerUserId) {
      console.log("⚠️ Skipping self profile view");
      return res.status(200).json({ viewed: false });
    }

    // Insert only if not exists
    const result = await ProfileView.updateOne(
      {
        profileUserId: new mongoose.Types.ObjectId(profileUserId),
        viewerUserId: new mongoose.Types.ObjectId(viewerUserId),
      },
      { $setOnInsert: {} },
      { upsert: true }
    );

    console.log("Mongo Update Result:", result);

    // If already viewed before → no push notification
    if (result.matchedCount > 0) {
      console.log("ℹ️ Profile already viewed earlier — no notification sent");
      return res.status(200).json({ viewed: false });
    }

    console.log("✔ First time viewing profile — logging & notifying");

    // Fetch viewer + profile owner
    const viewer = await User.findById(viewerUserId).select("name");
    const profileUser = await User.findById(profileUserId).select(
      "name pushNotificationToken"
    );

    console.log("Viewer Name:", viewer?.name || "Unknown");
    console.log("Profile Owner Name:", profileUser?.name || "Unknown");
    console.log(
      "Profile Owner FCM Token:",
      profileUser?.pushNotificationToken
        ? profileUser.pushNotificationToken.slice(0, 15) + "..."
        : "NONE"
    );

    // Send push notification only if FCM token exists
    if (profileUser?.pushNotificationToken) {
      const title = "viewed profile 👀";
      const body = `${viewer?.name || "Someone"} viewed your profile`;

      const payloadData = {
        type: "PROFILE_VIEW",
        profileUserId: profileUserId.toString(),
        viewerUserId: viewerUserId.toString(),
      };

      console.log("📨 Preparing push notification payload:", payloadData);

      await sendPushNotification(
        profileUser.pushNotificationToken,
        title,
        body,
        payloadData,
        null,
        [],
        1
      );

      console.log("🔔 Push Notification Sent Successfully");
    } else {
      console.log("⚠️ No push token — notification skipped");
    }

    console.log("✅ Profile view recorded successfully\n");

    return res.status(200).json({
      viewed: true,
      issuccess: true,
      message: "Profile view counted",
    });
  } catch (error) {
    console.error("❌ Profile view error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getProfileViewCount = async (req, res) => {
  try {
    const { profileUserId } = req.params;

    console.log("---- 📊 FETCH PROFILE VIEW COUNT ----");
    console.log("Profile User ID:", profileUserId);

    const count = await ProfileView.countDocuments({
      profileUserId: new mongoose.Types.ObjectId(profileUserId),
    });

    console.log("Total Views:", count);

    return res.status(200).json({
      profileUserId,
      totalViews: count,
      issuccess: true,
    });
  } catch (error) {
    console.error("❌ Profile view count error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
