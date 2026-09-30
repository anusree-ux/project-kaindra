const Career = require("../models/core/Career");

const initialCareers = [
  {
    title: "Business Development Associate",
    department: "Business Development",
    location: "India",
    type: "Full Time",
    experience: "Fresher / 0–1 Years",
    description: "Responsible for relationship building, client communication, and supporting Kaindra business growth.",
  },
  {
    title: "Business Development Executive",
    department: "Business Development",
    location: "India",
    type: "Full Time",
    experience: "0–2 Years",
    description: "Drive strategic partnerships, customer outreach, and expansion opportunities.",
  },
  {
    title: "Sales Executive",
    department: "Sales",
    location: "India",
    type: "Full Time",
    experience: "0–2 Years",
    description: "Engage prospective partners and customers, present solution offerings, and achieve sales milestones.",
  },
  {
    title: "Senior Sales Executive",
    department: "Sales",
    location: "India",
    type: "Full Time",
    experience: "1–3 Years",
    description: "Lead high-value account acquisition, sales negotiations, and market penetration.",
  },
  {
    title: "Business Development Manager",
    department: "Business Development",
    location: "India",
    type: "Full Time",
    experience: "2–5 Years",
    description: "Formulate growth strategies, oversee partner ecosystems, and direct key business initiatives.",
  },
  {
    title: "Sales Manager",
    department: "Sales",
    location: "India",
    type: "Full Time",
    experience: "2–5 Years",
    description: "Direct end-to-end sales operations, lead sales teams, and drive annual revenue growth.",
  },
];

async function seedInitialCareers() {
  try {
    const count = await Career.countDocuments();
    if (count === 0) {
      console.log("Seeding initial 6 career positions into MongoDB...");
      await Career.insertMany(initialCareers);
      console.log("Initial careers successfully seeded into MongoDB!");
    }
  } catch (error) {
    console.error("Error seeding initial careers:", error);
  }
}

module.exports = {
  seedInitialCareers,
  initialCareers,
};
