const User = require("../../src/models/core/User");
const { signAccessToken } = require("../../src/utils/jwt");

let phoneCounter = 9000000000;

/**
 * Creates a verified user directly in MongoDB for feature testing
 * @param {Object} data Overrides for user fields
 * @returns {Promise<{user: Object, token: string, userId: string}>}
 */
const createTestUser = async (data = {}) => {
  phoneCounter += 1;
  const defaultUser = {
    name: "Test Rider",
    email: `rider.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`,
    password: "password123",
    phoneNumber: `+91${phoneCounter}`,
    isPhoneVerified: true,
    role: "user",
  };

  const user = await User.create({ ...defaultUser, ...data });
  const token = signAccessToken({ id: user._id, role: user.role });

  return { user, token, userId: user._id };
};

module.exports = { createTestUser };
