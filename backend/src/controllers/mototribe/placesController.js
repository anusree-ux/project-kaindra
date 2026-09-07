const { getNearbyPlaces, CATEGORY_MAP } = require("../../services/mototribe/placesService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get nearby services using Google Places API (server-side)
 * @route   GET /api/mototribe/nearby-services?lat=X&lng=Y&category=fuel&radius=5000
 * @access  Private (Logged-in users)
 */
const getNearbyServices = async (req, res, next) => {
  try {
    const { lat, lng, category, radius } = req.query;

    // 1. Validate latitude & longitude query parameters
    if (lat === undefined || lng === undefined) {
      return next(
        new AppError("Latitude (lat) and Longitude (lng) are required query parameters.", 400)
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return next(
        new AppError("Latitude (lat) must be a valid number between -90 and 90.", 400)
      );
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return next(
        new AppError("Longitude (lng) must be a valid number between -180 and 180.", 400)
      );
    }

    // 2. Validate category
    const allowedCategories = Object.keys(CATEGORY_MAP);
    if (!category || !allowedCategories.includes(category)) {
      return next(
        new AppError(
          `Category is required and must be one of: ${allowedCategories.join(", ")}.`,
          400
        )
      );
    }

    // 3. Parse optional radius
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    if (isNaN(radiusMeters) || radiusMeters <= 0) {
      return next(
        new AppError("Radius must be a positive integer in meters.", 400)
      );
    }

    // 4. Fetch places from service
    const { places, fromCache } = await getNearbyPlaces(latNum, lngNum, category, radiusMeters);

    res.status(200).json({
      status: "success",
      category,
      results: places.length,
      fromCache,
      data: {
        places,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyServices,
};
