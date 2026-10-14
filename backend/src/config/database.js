const mongoose = require("mongoose");
const env = require("./environment");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    if (process.env.NODE_ENV === "test" && !process.env.DATABASE_URL) {
      return;
    }
    const dbUrl = process.env.DATABASE_URL || env.database.url;
    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Clean up users collection: remove phoneNumber and password fields, and drop old phone index
    if (process.env.NODE_ENV !== "test") {
      try {
        const User = require("../models/core/User");
        const indexes = await User.collection.indexes();
        const phoneIndex = indexes.find((idx) => idx.name === "phoneNumber_1");
        if (phoneIndex) {
          await User.collection.dropIndex("phoneNumber_1");
          console.log("Successfully dropped legacy phoneNumber_1 index from users collection.");
        }

        // Unset phoneNumber, password, and isPhoneVerified from all existing user documents
        await User.updateMany(
          {},
          { $unset: { phoneNumber: "", password: "", isPhoneVerified: "" } }
        );
        console.log("Cleaned up users collection: removed phoneNumber and password fields.");
      } catch (idxErr) {
        console.warn("User collection cleanup notice:", idxErr.message);
      }

      try {
        const FuelPrice = require("../models/mototribe/FuelPrice");
        const count = await FuelPrice.countDocuments();
        if (count === 0) {
          const { syncIOCLFuelPrices } = require("../services/mototribe/ioclFuelPriceService");
          await syncIOCLFuelPrices();
          console.log("Auto-seeded 33 IOCL state-wise fuel price records into DB.");
        }
      } catch (seedErr) {
        console.warn("Auto-seed fuel prices skipped:", seedErr.message);
      }
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
