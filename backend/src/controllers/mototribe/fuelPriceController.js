const FuelPrice = require("../../models/mototribe/FuelPrice");
const { calculateFuelCostService } = require("../../services/mototribe/fuelCostService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Retrieve all currently available latest fuel prices
 * @route   GET /api/mototribe/fuel-prices
 * @access  Private (JWT Protected)
 */
const getAllFuelPrices = async (req, res, next) => {
  try {
    const { state, city, isEstimate, latestOnly } = req.query;

    const query = {};

    // Default to latest active prices unless requested otherwise
    if (latestOnly !== "false") {
      query.isLatest = true;
    }

    if (state) {
      query.state = new RegExp(state.trim(), "i");
    }

    if (city) {
      query.city = new RegExp(city.trim(), "i");
    }

    if (isEstimate !== undefined) {
      query.isEstimate = isEstimate === "true";
    }

    const fuelPrices = await FuelPrice.find(query).sort({ location: 1 });

    res.status(200).json({
      status: "success",
      results: fuelPrices.length,
      data: {
        fuelPrices,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve the latest fuel price for a given location, city, or state
 * @route   GET /api/mototribe/fuel-prices/search?location=... OR GET /api/mototribe/fuel-prices/:location
 * @access  Private (JWT Protected)
 */
const getFuelPriceByLocation = async (req, res, next) => {
  try {
    const searchTarget =
      req.params.location || req.query.location || req.query.query || req.query.state || req.query.city;

    if (!searchTarget || searchTarget.trim().length === 0) {
      return next(
        new AppError(
          "Location, state, or city name is required. Example: /api/mototribe/fuel-prices/Delhi or ?location=Bengaluru",
          400
        )
      );
    }

    const trimmedTarget = searchTarget.trim();
    const regex = new RegExp(trimmedTarget, "i");

    // Search precedence: Exact location -> Exact city -> Exact state -> Substring regex match
    let fuelPrice = await FuelPrice.findOne({
      location: trimmedTarget,
      isLatest: true,
    });

    if (!fuelPrice) {
      fuelPrice = await FuelPrice.findOne({
        city: trimmedTarget,
        isLatest: true,
      });
    }

    if (!fuelPrice) {
      fuelPrice = await FuelPrice.findOne({
        state: trimmedTarget,
        isLatest: true,
      });
    }

    if (!fuelPrice) {
      fuelPrice = await FuelPrice.findOne({
        $or: [{ location: regex }, { city: regex }, { state: regex }],
        isLatest: true,
      });
    }

    if (!fuelPrice) {
      return next(
        new AppError(
          `No fuel price data found for location '${trimmedTarget}'.`,
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        fuelPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate estimated fuel cost for a ride based on distance, mileage, fuel type, and stored fuel prices
 * @route   POST /api/mototribe/fuel-prices/estimate OR POST /api/mototribe/fuel-prices/calculate
 * @access  Private (JWT Protected)
 */
const calculateFuelCost = async (req, res, next) => {
  try {
    const { distance, mileage, fuelType, location } = req.body;

    const result = await calculateFuelCostService({
      distance,
      mileage,
      fuelType,
      location,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or insert fuel price record (Designed for daily scheduled updates at 6 AM or admin revisions)
 * @route   POST /api/mototribe/fuel-prices
 * @access  Private (JWT Protected - Admin/Service)
 */
const upsertFuelPrice = async (req, res, next) => {
  try {
    const {
      location,
      city,
      state,
      petrolPrice,
      dieselPrice,
      isEstimate,
      effectiveDate,
      note,
    } = req.body;

    if (!location || !city || !state || petrolPrice === undefined || dieselPrice === undefined) {
      return next(
        new AppError(
          "location, city, state, petrolPrice, and dieselPrice are required.",
          400
        )
      );
    }

    const priceEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();

    // Mark previous entries for this location as not latest
    await FuelPrice.updateMany(
      { location: location.trim(), effectiveDate: { $ne: priceEffectiveDate } },
      { $set: { isLatest: false } }
    );

    const fuelPrice = await FuelPrice.findOneAndUpdate(
      { location: location.trim(), effectiveDate: priceEffectiveDate },
      {
        $set: {
          location: location.trim(),
          city: city.trim(),
          state: state.trim(),
          petrolPrice: Number(petrolPrice),
          dieselPrice: Number(dieselPrice),
          isEstimate: isEstimate !== undefined ? Boolean(isEstimate) : false,
          effectiveDate: priceEffectiveDate,
          isLatest: true,
          ...(note && { note: note.trim() }),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: "Fuel price record updated successfully.",
      data: {
        fuelPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFuelPrices,
  getFuelPriceByLocation,
  calculateFuelCost,
  upsertFuelPrice,
};

