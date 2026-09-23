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
const fuelPriceRoutes = require("./routes/mototribe/fuelPriceRoutes");
const agoraRoutes = require("./routes/mototribe/agoraRoutes");
const vehicleRoutes = require("./routes/mototribe/vehicleRoutes");
const expenseRoutes = require("./routes/mototribe/expenseRoutes");
const routeReportRoutes = require("./routes/mototribe/routeReportRoutes");
const presenceRoutes = require("./routes/mototribe/presenceRoutes");
const connectionRoutes = require("./routes/core/connectionRoutes");
const careerRoutes = require("./routes/core/careerRoutes");
const applicationRoutes = require("./routes/core/applicationRoutes");
const communityRoutes = require("./routes/core/communityRoutes");
const adminRoutes = require("./routes/core/adminRoutes");
const orderRoutes = require("./routes/core/orderRoutes");
const articleRoutes = require("./routes/modasphere/articleRoutes");
const academyRoutes = require("./routes/modasphere/academyRoutes");
const productRoutes = require("./routes/modasphere/productRoutes");
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

// Core Connection & Operations Routes
app.use("/api/v1/core", connectionRoutes);
app.use("/api/core", connectionRoutes);

app.use("/api/v1/careers", careerRoutes);
app.use("/api/careers", careerRoutes);

app.use("/api/v1/applications", applicationRoutes);
app.use("/api/applications", applicationRoutes);

app.use("/api/v1/community", communityRoutes);
app.use("/api/community", communityRoutes);

app.use("/api/v1/admin", adminRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/v1/orders", orderRoutes);
app.use("/api/orders", orderRoutes);

// ModaSphere Routes
app.use("/api/modasphere/articles", articleRoutes);
app.use("/api/modasphere/academy", academyRoutes);
app.use("/api/modasphere/products", productRoutes);
app.use("/api/v1/modasphere/products", productRoutes);

// MotoTribe Routes (supports both /api/mototribe and /api/v1/mototribe)
app.use("/api/v1/mototribe", directionsRoutes);
app.use("/api/mototribe", directionsRoutes);

app.use("/api/v1/mototribe", placesRoutes);
app.use("/api/mototribe", placesRoutes);

app.use("/api/v1/mototribe", routeMatchRoutes);
app.use("/api/mototribe", routeMatchRoutes);

app.use("/api/v1/mototribe", rideRoutes);
app.use("/api/mototribe", rideRoutes);

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

app.use("/api/v1/mototribe", fuelPriceRoutes);
app.use("/api/mototribe", fuelPriceRoutes);

app.use("/api/v1/mototribe", agoraRoutes);
app.use("/api/mototribe", agoraRoutes);

app.use("/api/v1/mototribe", vehicleRoutes);
app.use("/api/mototribe", vehicleRoutes);

app.use("/api/v1/mototribe", expenseRoutes);
app.use("/api/mototribe", expenseRoutes);

app.use("/api/v1/mototribe", routeReportRoutes);
app.use("/api/mototribe", routeReportRoutes);

app.use("/api/v1/mototribe", presenceRoutes);
app.use("/api/mototribe", presenceRoutes);

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