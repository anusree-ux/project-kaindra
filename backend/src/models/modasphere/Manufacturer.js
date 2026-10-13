const mongoose = require("mongoose");

const manufacturerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
    },
    capabilities: {
      type: [String],
      default: [],
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum order quantity must be at least 1."],
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: [1, "Lead time days must be at least 1."],
    },
    certifications: {
      type: [String],
      default: [],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Manufacturer = mongoose.model("Manufacturer", manufacturerSchema);

module.exports = Manufacturer;
