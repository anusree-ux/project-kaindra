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

    // Auto-seed IOCL state fuel prices if collection is empty
    if (process.env.NODE_ENV !== "test") {
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
