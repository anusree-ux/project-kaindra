const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      default: "General",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      default: "India",
    },
    type: {
      type: String,
      required: [true, "Employment type is required"],
      trim: true,
      default: "Full Time",
    },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Career", careerSchema);
