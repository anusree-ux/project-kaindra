/**
 * Seed script for Admin User
 * 
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env and stores/updates
 * the admin user with role: "admin" and isPhoneVerified: true in MongoDB.
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/database");
const User = require("../src/models/core/User");

const seedAdmin = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Admin User seeding...");

    const email = (process.env.ADMIN_EMAIL || "admin@kaindra.com").trim().toLowerCase();
    const plainPassword = process.env.ADMIN_PASSWORD || "admin123";
    const phoneNumber = "919999999999";
    const name = "Kaindra Administrator";

    let admin = await User.findOne({ email }).select("+password");

    if (admin) {
      admin.name = name;
      admin.password = plainPassword; // pre('save') hook hashes it
      admin.role = "admin";
      admin.isPhoneVerified = true;
      admin.phoneNumber = admin.phoneNumber || phoneNumber;
      await admin.save();
      console.log(`Updated existing user to Admin: ${email}`);
    } else {
      admin = await User.create({
        name,
        email,
        phoneNumber,
        password: plainPassword,
        role: "admin",
        isPhoneVerified: true,
      });
      console.log(`Created new Admin user: ${email}`);
    }

    console.log("Admin details:");
    console.log(`- ID: ${admin._id}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Role: ${admin.role}`);
    console.log(`- Phone Verified: ${admin.isPhoneVerified}`);
    console.log("- Password: [Configured from .env]");

    console.log("\nAdmin user seeded successfully in DB!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Admin user:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = { seedAdmin };
