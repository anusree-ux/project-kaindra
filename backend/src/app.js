const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const authRoutes = require("./routes/core/authRoutes");
const rideRoutes = require("./routes/mototribe/rideRoutes");
const placesRoutes = require("./routes/mototribe/placesRoutes");
const directionsRoutes = require("./routes/mototribe/directionsRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Connect to Database
connectDB();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Kaindra API is running" });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// MotoTribe Routes (supports both /api/mototribe and /api/v1/mototribe)
app.use("/api/v1/mototribe", rideRoutes);
app.use("/api/mototribe", rideRoutes);

app.use("/api/v1/mototribe", placesRoutes);
app.use("/api/mototribe", placesRoutes);

app.use("/api/v1/mototribe", directionsRoutes);
app.use("/api/mototribe", directionsRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;