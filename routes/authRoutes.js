const express = require("express");
const { generateOtp, resendOtp, verifyOtp } = require("../controllers/authController");

const router = express.Router();

router.post("/generate-otp", generateOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
