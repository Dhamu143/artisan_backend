const mongoose = require("mongoose");
const { LANGUAGES } = require("../constants/languages");

const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

const WorkingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    time: {
      type: String,
      default: "",
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    // googleId: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    displayName: String,
    image: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    languageCode: {
      type: String,
      enum: LANGUAGE_CODES,
      index: true,
    },
    pushNotificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    isAuthenticat: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    isAdminApproved: { type: Boolean, default: true },

    otp: Object,
    gender: { type: String },
    token: { type: String },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    businessEmail: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },

    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    presentArea: { type: String, trim: true },
    presentState: { type: String, trim: true },
    presentDistrict: { type: String, trim: true },
    presentBlock: { type: String, trim: true },
    presentCountry: { type: String, trim: true },
    selectedCallingCode: { type: String, trim: true },
    selectedCountryName: { type: String, trim: true },

    teamSize: { type: String, trim: true },
    artisanBio: { type: String, trim: true },
    findArtisan: { type: Boolean },
    categoryId: { type: String },
    subCategoryId: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    resumeUrl: { type: String, trim: true },

    profileImage: { type: String, trim: true },
    workImages: [{ type: String, trim: true }],
    experienceCertificate: [{ type: String, trim: true }],
    qualificationCertificate: [{ type: String, trim: true }],
    workingHours: [WorkingHoursSchema],
    businessDescription: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true },
    panCard: { type: String, trim: true },
    aadharCard: { type: String, trim: true },
    switchArtisan: { type: Boolean, default: false },

    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strict: true,
    minimize: false,
  }
);

module.exports = mongoose.model("User", userSchema);
