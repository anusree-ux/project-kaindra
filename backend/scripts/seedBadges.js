const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const Badge = require("../src/models/mototribe/Badge");

const initialBadges = [
  {
    key: "first_ride",
    name: "First Ride",
    description: "Complete your first ride",
    criteriaType: "ridesCompleted",
    criteriaValue: 1,
  },
  {
    key: "five_rides",
    name: "Five Rides",
    description: "Complete 5 rides",
    criteriaType: "ridesCompleted",
    criteriaValue: 5,
  },
  {
    key: "century_rider",
    name: "Century Rider",
    description: "Ride 100 km total",
    criteriaType: "totalDistanceKm",
    criteriaValue: 100,
  },
  {
    key: "thousand_km_club",
    name: "1,000 km Club",
    description: "Ride 1000 km total",
    criteriaType: "totalDistanceKm",
    criteriaValue: 1000,
  },
  {
    key: "explorer",
    name: "Explorer",
    description: "Visit 5 different regions",
    criteriaType: "regionsExplored",
    criteriaValue: 5,
  },
  {
    key: "social_rider",
    name: "Social Rider",
    description: "Join 10 ride groups",
    criteriaType: "rideGroupsJoined",
    criteriaValue: 10,
  },
];

const seedBadges = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for badge seeding...");

    for (const badgeData of initialBadges) {
      await Badge.findOneAndUpdate(
        { key: badgeData.key },
        { $set: badgeData },
        { upsert: true, new: true }
      );
      console.log(`Seeded badge: ${badgeData.key}`);
    }

    console.log("All badges seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding badges:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedBadges();
}

module.exports = {
  initialBadges,
  seedBadges,
};
