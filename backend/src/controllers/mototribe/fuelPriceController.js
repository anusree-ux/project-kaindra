const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const {
  getCurrentAverage,
  submitFuelPrice,
  estimateFuelCost,
} = require("../../services/mototribe/fuelPriceService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Submit a crowdsourced fuel price (Any logged-in user)
 * @route   POST /api/mototribe/fuel-prices
 * @access  Private (JWT Protected)
 */
const postFuelPriceSubmission = async (req, res, next) => {
  try {
    const { state, fuelType, pricePerLiter } = req.body;

    const result = await submitFuelPrice(
      req.user._id,
      state,
      fuelType,
      pricePerLiter
    );

    res.status(201).json({
      status: "success",
      message: "Fuel price submitted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current 7-day median fuel price for a state & fuel type
 * @route   GET /api/mototribe/fuel-prices?state=X&fuelType=Y
 * @access  Private (JWT Protected)
 */
const getFuelPriceAverageController = async (req, res, next) => {
  try {
    const { state, fuelType } = req.query;

    if (!state || !fuelType) {
      return next(
        new AppError(
          "Query parameters 'state' and 'fuelType' are required. Example: /api/mototribe/fuel-prices?state=Maharashtra&fuelType=petrol",
          400
        )
      );
    }

    const stats = await getCurrentAverage(state, fuelType);

    // If fallback, attach national default price for response completeness
    let responseData = { ...stats };
    if (stats.isFallback) {
      const fallbackPrice = stats.fuelType === "petrol" ? 105.0 : 95.0;
      responseData.median = fallbackPrice;
      responseData.note = `No community submissions in the last 7 days. Returning national default fallback price (₹${fallbackPrice}/L).`;
    } else {
      responseData.note = `Calculated using 7-day community median price from ${stats.count} submission(s).`;
    }

    res.status(200).json({
      status: "success",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get estimated fuel cost for a ride using crowdsourced state prices
 * @route   GET /api/mototribe/rides/:id/fuel-estimate?state=X&mileage=Y&fuelType=Z
 * @access  Private (Confirmed participants & Organizer only)
 */
const getRideFuelEstimateController = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const { state, mileage, fuelType } = req.query;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // Authorization check: Organizer or confirmed participant
    const isOrganizer = ride.organizerId.toString() === req.user._id.toString();
    const participant = await RideParticipant.findOne({
      rideId: ride._id,
      userId: req.user._id,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "You must be an organizer or confirmed participant of this ride to view fuel estimates.",
          403
        )
      );
    }

    const distanceKm = ride.distanceKm;
    const vehicleMileageKmpl = mileage ? Number(mileage) : 40; // Default 40 km/L if omitted
    const targetState = state || ride.origin || "Delhi";
    const targetFuelType = fuelType || "petrol";

    const estimate = await estimateFuelCost(
      distanceKm,
      vehicleMileageKmpl,
      targetState,
      targetFuelType
    );

    res.status(200).json({
      status: "success",
      data: {
        rideId: ride._id,
        rideTitle: ride.title,
        ...estimate,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postFuelPriceSubmission,
  getFuelPriceAverageController,
  getRideFuelEstimateController,
};
