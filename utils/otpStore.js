const otpCache = new Map();
const OTP_EXPIRY_MS = 30000;

const saveOTP = (mobileNumber, otp) => {
  const key = mobileNumber;
  const expiryTime = Date.now() + OTP_EXPIRY_MS;

  otpCache.set(key, {
    otp: String(otp),
    expiry: expiryTime,
  });
};

const verifyStoredOTP = (mobileNumber, submittedOtp) => {
  const stored = otpCache.get(mobileNumber);
  if (!stored) return false;

  if (Date.now() > stored.expiry) {
    otpCache.delete(mobileNumber);
    return false;
  }

  if (stored.otp === String(submittedOtp)) {
    otpCache.delete(mobileNumber);
    return true;
  }

  return false;
};

module.exports = {
  saveOTP,
  verifyStoredOTP,
};
