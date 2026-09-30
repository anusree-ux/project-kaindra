const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const { getWeather } = require("../../services/mototribe/weatherService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get weather forecast for a ride (uses origin coordinates, falls back to destination)
 * @route   GET /api/mototribe/rides/:id/weather
 * @access  Private (Confirmed Participant or Organizer)
 */
const getRideWeather = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    // 1. Fetch Ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 2. Authorization: Organizer or Confirmed Participant
    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "Must be a confirmed participant or organizer of this ride to view weather forecast.",
          403
        )
      );
    }

    // 3. Determine coordinates (origin coordinates first, fallback to destination)
    let latitude = ride.originLat;
    let longitude = ride.originLng;
    let locationType = "origin";

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      latitude = ride.destLat;
      longitude = ride.destLng;
      locationType = "destination";
    }

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return next(
        new AppError(
          "Ride does not have route coordinates configured. Please compute route for this ride first.",
          400
        )
      );
    }

    // 4. Fetch weather data
    const weatherData = await getWeather(latitude, longitude);

    res.status(200).json({
      status: "success",
      data: {
        rideId: ride._id,
        locationType,
        latitude,
        longitude,
        weather: weatherData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get weather forecast by standalone lat/lng coordinates
 * @route   GET /api/mototribe/weather?lat=X&lng=Y
 * @access  Private (Logged-in User)
 */
const getWeatherByCoordinates = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (lat === undefined || lng === undefined || lat === "" || lng === "") {
      return next(
        new AppError("Query parameters 'lat' and 'lng' are required.", 400)
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return next(
        new AppError(
          "Query parameters 'lat' and 'lng' must be valid numbers.",
          400
        )
      );
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return next(
        new AppError(
          "Latitude must be between -90 and 90, and longitude between -180 and 180.",
          400
        )
      );
    }

    const weatherData = await getWeather(latNum, lngNum);

    res.status(200).json({
      status: "success",
      data: {
        latitude: latNum,
        longitude: lngNum,
        weather: weatherData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRideWeather,
  getWeatherByCoordinates,
};
