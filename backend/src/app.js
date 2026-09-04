const express = require("express");
const connectDB = require("./config/database");
const authRoutes = require("./routes/core/authRoutes");

const app = express();

// Connect to Database
connectDB();

// Body parser
app.use(express.json());

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Kaindra API is running" });
});

// API Routes
app.use("/api/v1/auth", authRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;