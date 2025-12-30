const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    rated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rated_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes (defined ONCE)
ratingSchema.index({ rated_by: 1 });
ratingSchema.index({ rated_to: 1 });

module.exports = mongoose.model("Rating", ratingSchema);


// const mongoose = require("mongoose");

// const ratingSchema = new mongoose.Schema(
//   {
//     rated_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     rated_to: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     rating: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 5,
//     },

//     review: {
//       type: String,
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// ratingSchema.index({ rated_to: 1 });
// ratingSchema.index({ rated_by: 1 });

// module.exports = mongoose.model("Rating", ratingSchema);
