const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const authRoutes = require("./routes/core/authRoutes");
const rideRoutes = require("./routes/mototribe/rideRoutes");
const placesRoutes = require("./routes/mototribe/placesRoutes");
const directionsRoutes = require("./routes/mototribe/directionsRoutes");
const sosRoutes = require("./routes/mototribe/sosRoutes");
const weatherRoutes = require("./routes/mototribe/weatherRoutes");
const passportRoutes = require("./routes/mototribe/passportRoutes");
const journalRoutes = require("./routes/mototribe/journalRoutes");
const routeMatchRoutes = require("./routes/mototribe/routeMatchRoutes");
const chatRoutes = require("./routes/mototribe/chatRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Connect to Database
connectDB();

// CORS Middleware (allow requests from frontend app)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Kaindra API is running" });
});

// Backend health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// MotoTribe Routes (supports both /api/mototribe and /api/v1/mototribe)
app.use("/api/v1/mototribe", routeMatchRoutes);
app.use("/api/mototribe", routeMatchRoutes);

app.use("/api/v1/mototribe", rideRoutes);
app.use("/api/mototribe", rideRoutes);

app.use("/api/v1/mototribe", placesRoutes);
app.use("/api/mototribe", placesRoutes);

app.use("/api/v1/mototribe", directionsRoutes);
app.use("/api/mototribe", directionsRoutes);

app.use("/api/v1/mototribe", sosRoutes);
app.use("/api/mototribe", sosRoutes);

app.use("/api/v1/mototribe", weatherRoutes);
app.use("/api/mototribe", weatherRoutes);

app.use("/api/v1/mototribe", passportRoutes);
app.use("/api/mototribe", passportRoutes);

app.use("/api/v1/mototribe", journalRoutes);
app.use("/api/mototribe", journalRoutes);

app.use("/api/v1/mototribe", chatRoutes);
app.use("/api/mototribe", chatRoutes);

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