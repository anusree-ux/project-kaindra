const mongoose = require("mongoose");
const env = require("./environment");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.database.url);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
