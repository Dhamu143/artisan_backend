const mongoose = require("mongoose");

const JobSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",         
      required: true,
      index: true,
    },

    categoryId: {
      type: String,       
      required: true,
      index: true,
    },

    subCategoryId: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobSubmission", JobSubmissionSchema);
