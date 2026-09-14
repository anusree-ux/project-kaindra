const mongoose = require("mongoose");

const rideExpenseSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: [true, "rideId is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: {
        values: ["fuel", "accommodation", "food", "toll", "maintenance", "other"],
        message: "Invalid expense category",
      },
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "Note cannot exceed 200 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const RideExpense = mongoose.model("RideExpense", rideExpenseSchema);

module.exports = RideExpense;
