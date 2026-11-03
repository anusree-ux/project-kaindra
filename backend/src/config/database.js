
const mongoose = require("mongoose");
const env = require("./environment");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (process.env.NODE_ENV === "test" && !process.env.DATABASE_URL) {
      return null;
    }

    const dbUrl = process.env.DATABASE_URL || env.database.url;

    if (!dbUrl) {
      throw new Error("DATABASE_URL is not configured.");
    }

    const conn = await mongoose.connect(dbUrl);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;