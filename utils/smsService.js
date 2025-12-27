
const sendSMSToMobile = async (mobile, otp) => {
  console.log(`SMS sent to ${mobile}: Your OTP is ${otp}`);
  return true;
};

module.exports = { sendSMSToMobile };
