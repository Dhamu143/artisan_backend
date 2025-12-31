const mongoose = require("mongoose");
const Rating = require("../models/ratingModel");
const User = require("../models/userModel");
const calculateRatingStats = require("../utils/ratingStats");
// Import the notification controller function
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

const addRating = async (req, res) => {
  try {
    const { rated_by, rated_to, rating, review } = req.body;

    console.log("🟡 Add Rating Request", {
      rated_by,
      rated_to,
      rating,
      hasReview: Boolean(review),
    });

    if (!rated_by || !rated_to || !rating) {
      console.log("⚠️ Missing fields in rating request");
      return res.status(400).json({ error: "Missing fields" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(rated_by) ||
      !mongoose.Types.ObjectId.isValid(rated_to)
    ) {
      console.log("❌ Invalid user id(s) in rating request");
      return res.status(400).json({ error: "Invalid User ID" });
    }

    // 1. Create rating
    const newRating = await Rating.create({
      rated_by,
      rated_to,
      rating,
      review,
    });

    console.log("✨ Rating stored", {
      ratingId: newRating._id,
      rated_by,
      rated_to,
      rating,
    });

    // 2. Update stats
    const stats = await calculateRatingStats(rated_to);
    await User.findByIdAndUpdate(rated_to, stats);

    // 3. Notification users
    const sender = await User.findById(rated_by).select("name");
    const receiver = await User.findById(rated_to).select(
      "pushNotificationToken name"
    );

    console.log("👤 Rating Users", {
      sender: sender ? sender.name : "Unknown",
      receiver: receiver ? receiver.name : "Unknown",
      hasReceiverToken: Boolean(receiver?.pushNotificationToken),
    });

    if (receiver && receiver.pushNotificationToken) {
      const title = "New Rating Received ⭐";
      const body = `${
        sender ? sender.name : "Someone"
      } rated you ${rating} stars`;

      const payloadData = {
        type: "NEW_RATING",
        ratingId: newRating._id.toString(),
        rating: String(rating),
        reviewerId: rated_by.toString(),
      };

      console.log("🚀 Sending Rating Notification", {
        toUser: receiver.name,
        tokenPreview: receiver.pushNotificationToken.slice(0, 12) + "...",
        title,
        body,
        payloadData,
      });

      sendPushNotification(
        receiver.pushNotificationToken,
        title,
        body,
        payloadData
      ).catch((err) =>
        console.error("❌ Failed to send rating notification:", err)
      );

      console.log(`🔔 Notification queued for ${receiver.name}`);
    } else {
      console.log("⚠️ Receiver has no FCM token — notification skipped");
    }

    res.status(201).json({
      issuccess: true,
      ...stats,
    });
  } catch (err) {
    console.error("❌ Add Rating Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getRatingsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    const ratings = await Rating.find({ rated_to: userId })
      .populate("rated_by", "name profileImage")
      .select("rated_by rating review createdAt")
      .lean();

    const count = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = count ? sum / count : 0;

    res.status(200).json({
      issuccess: true,
      rated_to: userId,
      count,
      averageRating,
      ratings,
    });
  } catch (err) {
    console.error("Get Ratings Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({ error: "Invalid Rating ID" });
    }

    const rating = await Rating.findByIdAndDelete(ratingId);
    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    const stats = await calculateRatingStats(rating.rated_to);

    await User.findByIdAndUpdate(rating.rated_to, stats);

    res.status(200).json({
      issuccess: true,
      message: "Rating deleted",
      ...stats,
    });
  } catch (err) {
    console.error("Delete Rating Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addRating,
  getRatingsForUser,
  deleteRating,
};
