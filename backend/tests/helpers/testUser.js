const User = require("../../src/models/core/User");
const Vehicle = require("../../src/models/mototribe/Vehicle");
const { signAccessToken } = require("../../src/utils/jwt");

let userCounter = 0;

/**
 * Creates a vehicle for a test user
 */
const createTestVehicle = async (userId, data = {}) => {
  const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000)}`;
  const defaultVehicle = {
    userId,
    vehicleName: "Test Royal Enfield 350",
    registrationNumber: `KA01MT${uniqueSuffix}`,
    fuelType: "petrol",
    mileageKmpl: 40,
    isDefault: true,
  };
  return await Vehicle.create({ ...defaultVehicle, ...data });
};

/**
 * Creates a verified user & default vehicle directly in MongoDB for feature testing
 * @param {Object} data Overrides for user fields
 * @returns {Promise<{user: Object, token: string, userId: string, vehicle: Object, vehicleId: string}>}
 */
const createTestUser = async (data = {}) => {
  userCounter += 1;
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
  const defaultUser = {
    name: "Test Rider",
    email: `rider.${Date.now()}.${userCounter}.${Math.floor(Math.random() * 100000)}@example.com`,
    password: "password123",
    phoneNumber: `919${randomDigits}`,
    isPhoneVerified: true,
    role: "user",
  };

  const user = await User.create({ ...defaultUser, ...data });
  const token = signAccessToken({ id: user._id, role: user.role });
  const vehicle = await createTestVehicle(user._id);

  return { user, token, userId: user._id, vehicle, vehicleId: vehicle._id };
};

module.exports = { createTestUser, createTestVehicle };
