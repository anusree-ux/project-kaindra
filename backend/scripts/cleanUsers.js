const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function cleanUsers() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB Atlas successfully.");
    const User = require("../src/models/core/User");

    const indexes = await User.collection.indexes();
    const phoneIdx = indexes.find((i) => i.name === "phoneNumber_1");
    if (phoneIdx) {
      await User.collection.dropIndex("phoneNumber_1");
      console.log("Dropped legacy phoneNumber_1 index.");
    } else {
      console.log("No legacy phoneNumber_1 index found (already dropped).");
    }

    const res = await User.collection.updateMany(
      {},
      { $unset: { phoneNumber: "", password: "", isPhoneVerified: "" } }
    );
    console.log(`Updated ${res.modifiedCount} user documents via native collection.`);

    const rawUsers = await User.collection.find({}).toArray();
    console.log("\nRaw user documents in database:");
    rawUsers.forEach((u) => {
      console.log(`- ${u.email}: [${Object.keys(u).join(", ")}]`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

cleanUsers();
