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

    console.log("PROFILE USER:", profileUserId);
    console.log("VIEWER USER:", viewerUserId);

    // Prevent self-view
    if (profileUserId === viewerUserId) {
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

    // If already viewed earlier → do NOT notify
    if (result.matchedCount > 0) {
      return res.status(200).json({ viewed: false });
    }

    // Fetch viewer + profile owner
    const viewer = await User.findById(viewerUserId).select("name");
    const profileUser = await User.findById(profileUserId).select(
      "name pushNotificationToken"
    );

    // Send push only if profile owner has FCM token
    if (profileUser?.pushNotificationToken) {
      const title = "Someone viewed your profile 👀";
      const body = `${viewer?.name || "Someone"} viewed your profile`;

      const payloadData = {
        type: "PROFILE_VIEW",
        profileUserId: profileUserId.toString(),
        viewerUserId: viewerUserId.toString(),
      };

      await sendPushNotification(
        profileUser.pushNotificationToken,
        title,
        body,
        payloadData,
        null,
        [],
        1
      );

      console.log("🔔 Profile view notification sent");
    }

    return res.status(200).json({
      viewed: true,
      issuccess: true,
      message: "Profile view counted",
    });
  } catch (error) {
    console.error("Profile view error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getProfileViewCount = async (req, res) => {
  try {
    const { profileUserId } = req.params;

    const count = await ProfileView.countDocuments({
      profileUserId: new mongoose.Types.ObjectId(profileUserId),
    });

    return res.status(200).json({
      profileUserId,
      totalViews: count,
      issuccess: true,
    });
  } catch (error) {
    console.error("Profile view count error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
