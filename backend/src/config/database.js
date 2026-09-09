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
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
