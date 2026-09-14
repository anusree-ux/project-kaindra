const User = require("../../src/models/core/User");
const Vehicle = require("../../src/models/mototribe/Vehicle");
const { signAccessToken } = require("../../src/utils/jwt");

let phoneCounter = 9000000000;
let regCounter = 1000;

/**
 * Creates a vehicle for a test user
 */
const createTestVehicle = async (userId, data = {}) => {
  regCounter += 1;
  const defaultVehicle = {
    userId,
    vehicleName: "Test Royal Enfield 350",
    registrationNumber: `KA01MT${regCounter}`,
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
  const vehicle = await createTestVehicle(user._id);

  return { user, token, userId: user._id, vehicle, vehicleId: vehicle._id };
};

module.exports = { createTestUser, createTestVehicle };
