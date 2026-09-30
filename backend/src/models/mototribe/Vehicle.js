const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleName: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "electric"],
      default: "petrol",
    },
    mileageKmpl: {
      type: Number,
      required: [true, "Mileage (km/L) is required"],
      min: [0.1, "Mileage must be greater than 0"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mask registration number for non-owner views safely (e.g. KA01AB1234 -> KA01****234)
 */
vehicleSchema.methods.toPublicJSON = function (requestingUserId) {
  const obj = this.toObject ? this.toObject() : { ...this };
  const isOwner =
    requestingUserId &&
    obj.userId &&
    obj.userId.toString() === requestingUserId.toString();

  if (!isOwner && obj.registrationNumber) {
    const str = String(obj.registrationNumber).trim();
    if (str.length <= 4) {
      obj.registrationNumber = "****";
    } else if (str.length <= 7) {
      const prefix = str.substring(0, 2);
      const suffix = str.substring(str.length - 2);
      obj.registrationNumber = `${prefix}****${suffix}`;
    } else {
      const prefix = str.substring(0, 4);
      const suffix = str.substring(str.length - 3);
      obj.registrationNumber = `${prefix}****${suffix}`;
    }
  }
  return obj;
};

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
