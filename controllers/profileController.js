const ProfileView = require("../models/profileViewModel");
const mongoose = require("mongoose");

exports.trackProfileView = async (req, res) => {
  try {
    const { profileUserId } = req.body;
    const viewerUserId = req.user.userId;

    console.log("PROFILE:", profileUserId);
    console.log("VIEWER:", viewerUserId);

    if (profileUserId === viewerUserId) {
      return res.status(200).json({ viewed: false });
    }

    const result = await ProfileView.updateOne(
      {
        profileUserId: new mongoose.Types.ObjectId(profileUserId),
        viewerUserId: new mongoose.Types.ObjectId(viewerUserId),
      },
      { $setOnInsert: {} },
      { upsert: true }
    );

    if (result.matchedCount > 0) {
      return res.status(200).json({ viewed: false });
    }

    return res.status(200).json({
      viewed: true,
      issuccess: true,
      message: "Profile view counted",
    });
  } catch (error) {
    console.error(error);
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
    return res.status(500).json({ message: "Server error" });
  }
};
