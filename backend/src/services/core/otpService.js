const bcrypt = require("bcryptjs");
const OtpVerification = require("../../models/core/OtpVerification");
const { sendSms, formatIndianPhoneNumber } = require("../mototribe/smsService");

/**
 * Generate a random 6-digit numeric OTP code
 * @returns {string}
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP code using bcrypt
 * @param {string} code
 * @returns {Promise<string>}
 */
const hashOtp = async (code) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(code, salt);
};

/**
 * Verify plaintext OTP against stored hash
 * @param {string} code
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyOtpHash = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};

/**
 * Generate OTP, save hashed record, and send via AWS SNS SMS Service
 * @param {string} userId
 * @param {string} phoneNumber
 * @param {number} resendCount
 * @returns {Promise<{success: boolean, expiresAt: Date, smsResult: Object}>}
 */
const sendOtpToUser = async (userId, phoneNumber, resendCount = 0) => {
  const formattedPhone = formatIndianPhoneNumber(phoneNumber);
  const otpCode = generateOtp();
  const hashedOtp = await hashOtp(otpCode);

  // Invalidate any previous unexpired OTP records for this user
  await OtpVerification.deleteMany({ userId });

  // 5-minute expiration from creation
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpVerification.create({
    userId,
    otpCode: hashedOtp,
    expiresAt,
    attempts: 0,
    resendCount,
  });

  const message = `Your MotoTribe verification code is ${otpCode}, valid for 5 minutes.`;
  const smsResult = await sendSms(formattedPhone, message);

  return {
    success: smsResult.success,
    expiresAt,
    otpCode, // Returned internally for test assertions
    smsResult,
  };
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  sendOtpToUser,
};
