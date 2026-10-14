const bcrypt = require("bcryptjs");
const OtpVerification = require("../../models/core/OtpVerification");
const { sendSms } = require("../mototribe/smsService");

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

const sendOtpToUser = async () => {
  return {
    success: false,
    message: "OTP login has been decommissioned in favor of Google OAuth.",
  };
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  sendOtpToUser,
};
