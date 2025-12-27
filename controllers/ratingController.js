const mongoose = require("mongoose");
const Rating = require("../models/ratingModel");
const User = require("../models/userModel");
const calculateRatingStats = require("../utils/ratingStats");

// const addRating = async (req, res) => {
//   try {
//     const { rated_by, rated_to, rating, review } = req.body;

//     if (!rated_by || !rated_to || !rating) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     if (
//       !mongoose.Types.ObjectId.isValid(rated_by) ||
//       !mongoose.Types.ObjectId.isValid(rated_to)
//     ) {
//       return res.status(400).json({ error: "Invalid User ID" });
//     }

//     await Rating.create({
//       rated_by,
//       rated_to,
//       rating,
//       review,
//     });

//     // ✅ Recalculate from source of truth
//     const stats = await Rating.aggregate([
//       { $match: { rated_to: new mongoose.Types.ObjectId(rated_to) } },
//       {
//         $group: {
//           _id: null,
//           totalRatings: { $sum: 1 },
//           ratingSum: { $sum: "$rating" },
//         },
//       },
//     ]);

//     const totalRatings = stats[0]?.totalRatings || 0;
//     const ratingSum = stats[0]?.ratingSum || 0;

//     // optional rounding to 1 decimal
//     const averageRating = totalRatings
//       ? Math.round((ratingSum / totalRatings) * 10) / 10
//       : 0;

//     await User.findByIdAndUpdate(rated_to, {
//       ratingSum,
//       totalRatings,
//       averageRating,
//     });

//     res.status(201).json({
//       issuccess: true,
//       averageRating,
//       totalRatings,
//     });
//   } catch (err) {
//     console.error("Add Rating Error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const getRatingsForUser = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     console.log("data", req.params.userId);
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: "Invalid User ID" });
//     }

//     const ratings = await Rating.find({ rated_to: userId });

//     let averageRating = 0;
//     const count = ratings.length;

//     if (count > 0) {
//       const sumOfRatings = ratings.reduce(
//         (acc, rating) => acc + rating.rating,
//         0
//       );

//       const rawAverage = sumOfRatings / count;
//       averageRating = rawAverage;
//     }
//     await User.findByIdAndUpdate(userId, {
//       averageRating: averageRating,
//       totalRatings: count,
//     });

//     const populatedRatings = await Rating.find({ rated_to: userId }).populate(
//       "rated_by"
//     );

//     res.status(200).json({
//       issuccess: true,
//       count: count,
//       averageRating: averageRating,
//       ratings: populatedRatings,
//     });
//   } catch (error) {
//     console.error("Error fetching ratings:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// ---------------- Delete Rating ----------------

const addRating = async (req, res) => {
  try {
    const { rated_by, rated_to, rating, review } = req.body;

    if (!rated_by || !rated_to || !rating) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(rated_by) ||
      !mongoose.Types.ObjectId.isValid(rated_to)
    ) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    await Rating.create({ rated_by, rated_to, rating, review });

    const stats = await calculateRatingStats(rated_to);

    await User.findByIdAndUpdate(rated_to, stats);

    res.status(201).json({
      issuccess: true,
      ...stats,
    });
  } catch (err) {
    console.error("Add Rating Error:", err);
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

// const deleteRating = async (req, res) => {
//   try {
//     const { ratingId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(ratingId)) {
//       return res.status(400).json({ error: "Invalid Rating ID" });
//     }

//     const deletedRating = await Rating.findByIdAndDelete(ratingId);

//     if (!deletedRating) {
//       return res.status(404).json({
//         error: "Rating not found",
//         issuccess: false,
//       });
//     }

//     const ratedTo = deletedRating.rated_to;

//     // ✅ Recalculate after delete
//     const remainingRatings = await Rating.find({ rated_to: ratedTo });

//     let avg = 0;
//     const total = remainingRatings.length;

//     if (total > 0) {
//       const sum = remainingRatings.reduce((acc, r) => acc + r.rating, 0);
//       avg = Math.round(sum / total);
//     }

//     await User.findByIdAndUpdate(ratedTo, {
//       averageRating: avg,
//       totalRatings: total,
//     });

//     res.status(200).json({
//       message: "Rating deleted successfully",
//       issuccess: true,
//       deletedRatingId: ratingId,
//       newAverageRating: avg,
//     });
//   } catch (error) {
//     console.error("Error deleting rating:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const deleteRating = async (req, res) => {
//   try {
//     const { ratingId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(ratingId)) {
//       return res.status(400).json({ error: "Invalid Rating ID" });
//     }

//     const rating = await Rating.findByIdAndDelete(ratingId);
//     if (!rating) {
//       return res.status(404).json({ error: "Rating not found" });
//     }

//     // ✅ Recalculate again
//     const stats = await Rating.aggregate([
//       { $match: { rated_to: rating.rated_to } },
//       {
//         $group: {
//           _id: null,
//           totalRatings: { $sum: 1 },
//           ratingSum: { $sum: "$rating" },
//         },
//       },
//     ]);

//     const totalRatings = stats[0]?.totalRatings || 0;
//     const ratingSum = stats[0]?.ratingSum || 0;
//     const averageRating = totalRatings ? ratingSum / totalRatings : 0;

//     await User.findByIdAndUpdate(rating.rated_to, {
//       ratingSum,
//       totalRatings,
//       averageRating,
//     });

//     res.status(200).json({
//       issuccess: true,
//       message: "Rating deleted",
//     });
//   } catch (err) {
//     console.error("Delete Rating Error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

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
