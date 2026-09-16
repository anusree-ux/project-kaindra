const mongoose = require("mongoose");

const routeReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    reportType: {
      type: String,
      required: [true, "Report type is required"],
      enum: {
        values: [
          "road_condition",
          "warning",
          "fuel_availability",
          "hotel_tip",
          "restaurant_tip",
          "scenic_spot",
          "general_tip",
        ],
        message: "Invalid report type",
      },
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [500, "Content cannot exceed 500 characters"],
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const RouteReport = mongoose.model("RouteReport", routeReportSchema);

module.exports = RouteReport;
