const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Admin = require("../src/models/core/Admin");

const seedAdmin = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is missing in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB for admin seeding...");

    const adminEmail = "admin@kaindra.com";
    const adminPassword = "admin123";

    let admin = await Admin.findOne({ email: adminEmail }).select("+password");

    if (!admin) {
      admin = await Admin.create({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log(`Successfully created admin user "${adminEmail}" in "admins" table.`);
    } else {
      const isMatch = await admin.comparePassword(adminPassword);
      if (!isMatch) {
        admin.password = adminPassword;
        await admin.save();
        console.log(`Updated password for admin user "${adminEmail}" in "admins" table.`);
      } else {
        console.log(`Admin user "${adminEmail}" already exists with the correct password in "admins" table.`);
      }
    }

    console.log("Admin details:", {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      collection: Admin.collection.name,
    });

    await mongoose.disconnect();
    console.log("Database disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
