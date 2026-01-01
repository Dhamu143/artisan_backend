const { generateSixDigitOTP } = require("../utils/otpGenerator");
const { sendSMSToMobile } = require("../utils/smsService");
const { saveOTP, verifyStoredOTP } = require("../utils/otpStore");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

const JWT_SECRET = process.env.JWT_SECRET || "SuperSecretKey";
const TOKEN_EXPIRE_TIME = "365d";
const COOKIE_EXPIRE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

const generateOtp = async (req, res) => {
  const { mobile_number, name, languageCode, latitude, longitude } = req.body;

  console.log("🔹 OTP generation request received");
  console.log("➡ Mobile:", mobile_number);
  console.log("➡ Name:", name);
  console.log("➡ Language:", languageCode);
  console.log("➡ latitude:", latitude);
  console.log("➡ longitude:", longitude);
  if (!mobile_number) {
    console.warn("⚠ Missing mobile_number in request body");
    return res.status(400).json({
      issuccess: false,
      error: "Mobile number is required",
    });
  }

  if (!name) {
    console.warn("⚠ Missing name in request body");
    return res.status(400).json({
      issuccess: false,
      error: "Name is required",
    });
  }

  const otp = generateSixDigitOTP();
  console.log("🔐 Generated OTP:", otp);

  try {
    console.log("🔄 Upserting user record…");

    const user = await User.findOneAndUpdate(
      { mobile_number },
      {
        $set: {
          name,
          isVerified: false,
          languageCode: languageCode || "en",
          latitude,
          longitude,
        },
      },
      { new: true, upsert: true }
    );

    console.log("🟢 User upserted:", user?._id || "(new user)");

    console.log("💾 Storing OTP temporarily…");
    saveOTP(mobile_number, otp);

    console.log("📨 Sending OTP via SMS…");
    await sendSMSToMobile(mobile_number, otp);

    console.log("✅ OTP generated and sent successfully");

    return res.status(200).json({
      issuccess: true,
      message: "OTP generated and sent",
      name,
      languageCode,
      latitude,
      longitude,
      otp,
      expiresIn: 30,
    });
  } catch (error) {
    console.error("🔥 OTP generation error:", error);
    return res.status(500).json({
      issuccess: false,
      error: "Internal server error",
    });
  }
};

const resendOtp = async (req, res) => {
  const { mobile_number, name } = req.body;

  if (!mobile_number) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  const otp = generateSixDigitOTP();

  try {
    await User.findOneAndUpdate(
      { mobile_number },
      {
        $set: {
          name,
          isVerified: false,
        },
      },
      { new: true }
    );

    saveOTP(mobile_number, otp);
    await sendSMSToMobile(mobile_number, otp);

    return res.status(200).json({
      issuccess: true,
      message: "OTP resent successfully",
      name,
      expiresIn: 60,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      issuccess: false,
      error: "Internal server error",
    });
  }
};

const verifyOtp = async (req, res) => {
  const {
    mobile_number,
    otp,
    languageCode,
    latitude,
    longitude,
    pushNotificationToken,
  } = req.body;

  console.log("➡ latitude:", latitude);
  console.log("➡ longitude:", longitude);
  console.log("➡ pushNotificationToken:", pushNotificationToken);

  if (!mobile_number || !otp) {
    return res.status(400).json({
      error: "Mobile number and OTP are required",
    });
  }

  try {
    const isOtpValid = await verifyStoredOTP(mobile_number, otp);
    if (!isOtpValid) {
      return res.status(401).json({
        error: "Your OTP has expired. Kindly generate a new OTP.",
      });
    }

    const user = await User.findOne({ mobile_number });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isVerified = true;

    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile_number },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE_TIME }
    );

    user.token = token;

    // 🔹 Save latest push notification token
    if (
      pushNotificationToken &&
      pushNotificationToken !== user.pushNotificationToken
    ) {
      user.pushNotificationToken = pushNotificationToken;
    }

    await user.save();

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: COOKIE_EXPIRE_MS,
    });

    const userResponse = user.toObject();
    delete userResponse.__v;
    delete userResponse.otp;

    // 🔔 Send login push notification
    const targetToken = pushNotificationToken || user.pushNotificationToken;

    if (targetToken) {
      const title = "Login Successful";
      const body = "You have logged in successfully.";

      const payloadData = {
        type: "LOGIN_SUCCESS",
        userId: user._id.toString(),
      };

      await sendPushNotification(
        targetToken,
        title,
        body,
        payloadData,
        null,
        [],
        1
      );
    }

    return res.status(200).json({
      issuccess: true,
      verified: true,
      switchArtisan: false,
      latitude,
      longitude,
      user: userResponse,
      pushNotificationToken,
      languageCode,
      message: "OTP verified successfully. User logged in.",
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  generateOtp,
  resendOtp,
  verifyOtp,
};
