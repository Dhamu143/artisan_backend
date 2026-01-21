const mongoose = require("mongoose");

const JobPostingSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    opening: {
      type: String,
      required: true,
      index: true,
    },
    experience: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    salary: {
      type: String,
      default: "Not Disclosed",
    },

    companyName: {
      type: String,
      required: true,
    },

    companyAddress: {
      type: String,
      required: true,
    },

    jobType: {
      type: String,
      default: "Full-time",
    },

    skills: {
      type: [String],
      default: [],
    },

    contactEmail: {
      type: String,
      required: true,
    },

    contactPhone: {
      type: String,
      required: true,
    },
    // ✅ CHANGE HERE
    categoryId: {
      type: String,
      required: true,
      index: true,
    },

    subCategoryId: {
      type: String,
      required: true,
      index: true,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("JobPosting", JobPostingSchema);
