const mongoose = require("mongoose");
const Rating = require("../models/ratingModel");
const User = require("../models/userModel");
const calculateRatingStats = require("../utils/ratingStats");
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

    const stats = await calculateRatingStats(rated_to);
    await User.findByIdAndUpdate(rated_to, stats);

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
      const body = `${sender ? sender.name : "Someone"
        } rated you ${rating} stars`;

      const payloadData = {
        type: "NEW_RATING",
        ratingId: newRating._id.toString(),
        rating: String(rating),
        reviewerId: rated_by.toString(),
      };

      console.log("🚀 Sending Rating Push Notification", {
        toUser: receiver.name,
        tokenPreview: receiver.pushNotificationToken.slice(0, 12) + "...",
        title,
        body,
        payloadData,
      });

      await sendPushNotification(
        receiver.pushNotificationToken,
        title,
        body,
        payloadData,
        null,
        [],
        1,
        false
      );

      console.log("🔔 Push notification sent for rating");
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    const totalRatings = await Rating.countDocuments({
      rated_to: userId,
    });

    const ratings = await Rating.find({ rated_to: userId })
      .populate("rated_by", "name profileImage")
      .select("rated_by rating review createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const ratingStats = await Rating.aggregate([
      { $match: { rated_to: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating =
      ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

    res.status(200).json({
      issuccess: true,
      rated_to: userId,
      pagination: {
        page,
        limit,
        totalRatings,
        totalPages: Math.ceil(totalRatings / limit),
      },
      count: ratings.length,
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
