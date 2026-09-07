const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const {
  geocodeLocation,
  getRoute,
} = require("../../services/mototribe/directionsService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Compute traffic-aware route for a ride (saves to ride.routeInfo)
 * @route   POST /api/mototribe/rides/:id/compute-route
 * @access  Private (Organizer only)
 */
const computeRideRoute = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 1. Guard check: Organizer only (403 Forbidden)
    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          "Only the ride organizer can compute or update the route.",
          403
        )
      );
    }

    // 2. Geocode origin and destination text if coordinates are not present
    let { originLat, originLng, destLat, destLng } = ride;

    if (!originLat || !originLng) {
      const originCoords = await geocodeLocation(ride.origin);
      originLat = originCoords.lat;
      originLng = originCoords.lng;
      ride.originLat = originLat;
      ride.originLng = originLng;
    }

    if (!destLat || !destLng) {
      const destCoords = await geocodeLocation(ride.destination);
      destLat = destCoords.lat;
      destLng = destCoords.lng;
      ride.destLat = destLat;
      ride.destLng = destLng;
    }

    // 3. Compute directions via Google Directions API
    const routeData = await getRoute(originLat, originLng, destLat, destLng);

    // 4. Save computed routeInfo to ride
    ride.routeInfo = routeData;
    await ride.save();

    res.status(200).json({
      status: "success",
      message: "Route computed and saved successfully.",
      data: {
        rideId: ride._id,
        originCoordinates: { lat: originLat, lng: originLng },
        destinationCoordinates: { lat: destLat, lng: destLng },
        routeInfo: ride.routeInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cached routeInfo for a ride (Read-only)
 * @route   GET /api/mototribe/rides/:id/route
 * @access  Private (Confirmed participants & Organizer)
 */
const getRideRoute = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 1. Guard check: Organizer or confirmed participant
    const isOrganizer =
      ride.organizerId.toString() === req.user._id.toString();

    const participant = await RideParticipant.findOne({
      rideId: ride._id,
      userId: req.user._id,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "You must be a confirmed participant or organizer of this ride to view the route.",
          403
        )
      );
    }

    // 2. Check if routeInfo has been computed
    if (!ride.routeInfo) {
      return next(
        new AppError(
          "Route has not been computed for this ride yet. The ride organizer must compute the route first.",
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        rideId: ride._id,
        originCoordinates: { lat: ride.originLat, lng: ride.originLng },
        destinationCoordinates: { lat: ride.destLat, lng: ride.destLng },
        routeInfo: ride.routeInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  computeRideRoute,
  getRideRoute,
};
