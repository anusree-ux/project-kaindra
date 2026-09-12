const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const FuelPrice = require("../src/models/mototribe/FuelPrice");

// Effective date set to start of day (UTC) for deterministic idempotency
const getEffectiveDate = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const effectiveDate = getEffectiveDate();

const initialFuelPrices = [
  {
    location: "Delhi",
    city: "Delhi",
    state: "Delhi",
    petrolPrice: 102.12,
    dieselPrice: 95.20,
    isEstimate: false,
    effectiveDate,
    isLatest: true,
    note: "City-level price used as state-level approximation.",
  },
  {
    location: "Mumbai, Maharashtra",
    city: "Mumbai",
    state: "Maharashtra",
    petrolPrice: 111.21,
    dieselPrice: 97.83,
    isEstimate: false,
    effectiveDate,
    isLatest: true,
    note: "City-level price used as state-level approximation.",
  },
  {
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    state: "Karnataka",
    petrolPrice: 110.82,
    dieselPrice: 98.78,
    isEstimate: false,
    effectiveDate,
    isLatest: true,
    note: "City-level price used as state-level approximation.",
  },
  {
    location: "Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    petrolPrice: 107.76,
    dieselPrice: 99.55,
    isEstimate: false,
    effectiveDate,
    isLatest: true,
    note: "City-level price used as state-level approximation.",
  },
  {
    location: "Hyderabad, Telangana",
    city: "Hyderabad",
    state: "Telangana",
    petrolPrice: 115.69,
    dieselPrice: 103.82,
    isEstimate: false,
    effectiveDate,
    isLatest: true,
    note: "City-level price used as state-level approximation.",
  },
  {
    location: "Ahmedabad, Gujarat",
    city: "Ahmedabad",
    state: "Gujarat",
    petrolPrice: 108.00,
    dieselPrice: 97.92,
    isEstimate: true,
    effectiveDate,
    isLatest: true,
    note: "Gujarat petrol value is a provisional estimate subject to correction.",
  },
  {
    location: "Kolkata, West Bengal",
    city: "Kolkata",
    state: "West Bengal",
    petrolPrice: 108.00,
    dieselPrice: 99.82,
    isEstimate: true,
    effectiveDate,
    isLatest: true,
    note: "West Bengal petrol value is a provisional estimate subject to correction.",
  },
];

const seedFuelPrices = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for fuel price seeding...");

    for (const item of initialFuelPrices) {
      // Mark older records for this location as not latest if inserting new effective date
      await FuelPrice.updateMany(
        { location: item.location, effectiveDate: { $ne: item.effectiveDate } },
        { $set: { isLatest: false } }
      );

      // Idempotent upsert by (location + effectiveDate)
      const doc = await FuelPrice.findOneAndUpdate(
        { location: item.location, effectiveDate: item.effectiveDate },
        { $set: item },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(
        `Seeded fuel price for [${doc.location}]: Petrol ₹${doc.petrolPrice}/L, Diesel ₹${doc.dieselPrice}/L (Estimate: ${doc.isEstimate})`
      );
    }

    console.log("All fuel prices seeded successfully!");
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error("Error seeding fuel prices:", error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedFuelPrices();
}

module.exports = {
  initialFuelPrices,
  seedFuelPrices,
};
