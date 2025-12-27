const mongoose = require("mongoose");
const Rating = require("../models/ratingModel");

const calculateRatingStats = async (ratedToId) => {
  const stats = await Rating.aggregate([
    {
      $match: {
        rated_to: new mongoose.Types.ObjectId(ratedToId),
      },
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        ratingSum: { $sum: "$rating" },
      },
    },
  ]);

  const totalRatings = stats[0]?.totalRatings || 0;
  const ratingSum = stats[0]?.ratingSum || 0;

  const averageRating = totalRatings
    ? Math.round((ratingSum / totalRatings) * 10) / 10
    : 0;

  return {
    totalRatings,
    ratingSum,
    averageRating,
  };
};

module.exports = calculateRatingStats;
