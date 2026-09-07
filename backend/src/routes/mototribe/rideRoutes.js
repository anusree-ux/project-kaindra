const express = require("express");
const {
  upsertRiderProfile,
  getMeRiderProfile,
  getMyRideHistory,
  createRide,
  getUpcomingRides,
  getRideDetails,
  joinRide,
  getRideParticipants,
  startRide,
  completeRide,
  cancelRide,
  confirmParticipant,
  getLiveLocations,
} = require("../../controllers/mototribe/rideController");
const { protect } = require("../../middleware/authMiddleware");
const {
  riderProfileValidationRules,
  createRideValidationRules,
  validate,
} = require("../../validators/mototribe/rideValidator");

const router = express.Router();

// All MotoTribe routes require authentication
router.use(protect);

// Rider Profile Endpoints
router.post(
  "/rider-profile",
  riderProfileValidationRules,
  validate,
  upsertRiderProfile
);
router.get("/rider-profile/me", getMeRiderProfile);
router.get("/rider-profile/me/history", getMyRideHistory);

// Ride Creation & Listing
router.post("/rides", createRideValidationRules, validate, createRide);
router.get("/rides", getUpcomingRides);
router.get("/rides/:id", getRideDetails);

// Ride Joining & Participant Management
router.post("/rides/:id/join", joinRide);
router.get("/rides/:id/participants", getRideParticipants);
router.patch("/rides/:id/participants/:userId/confirm", confirmParticipant);

// Ride Lifecycle Status Transitions (Organizer Only)
router.patch("/rides/:id/start", startRide);
router.patch("/rides/:id/complete", completeRide);
router.patch("/rides/:id/cancel", cancelRide);

// Live Location Tracking REST Fallback
router.get("/rides/:id/live-locations", getLiveLocations);

module.exports = router;
