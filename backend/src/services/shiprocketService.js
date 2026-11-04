
const crypto = require("crypto");
const env = require("../config/environment");

const createMockShipment = async (order) => {
  if (!order || !order._id) {
    throw new Error("A valid order is required to create a shipment.");
  }

  const reference = crypto.randomBytes(4).toString("hex").toUpperCase();
  const now = new Date();

  return {
    provider: "shiprocket",
    isMock: true,

    orderId: String(order._id),
    shipmentId: `MOCK-SHIP-${reference}`,
    awbCode: `MOCK-AWB-${reference}`,
    courierName: "Mock Express",

    status: "pending_pickup",
    trackingUrl: null,
    labelUrl: null,

    createdAt: now,
  };
};

const createShipment = async (order) => {
  // Mock mode is permitted only outside production.
  if (env.shiprocket.mockMode && env.nodeEnv !== "production") {
    return createMockShipment(order);
  }

  throw new Error(
    "Shiprocket API integration is not configured yet. Enable mock mode for local development."
  );
};

module.exports = {
  createShipment,
};
