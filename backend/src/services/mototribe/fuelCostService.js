const FuelPrice = require("../../models/mototribe/FuelPrice");
const AppError = require("../../utils/AppError");

/**
 * Calculates estimated fuel required and cost for a given distance, mileage, fuel type, and optional location.
 * Uses existing FuelPrice database records for price reference.
 *
 * @param {Object} params
 * @param {number|string} params.distance - Distance in km (must be > 0)
 * @param {number|string} params.mileage - Vehicle mileage in km/L (must be > 0)
 * @param {string} params.fuelType - Fuel type ('PETROL' or 'DIESEL')
 * @param {string} [params.location] - Optional location, city, or state name for location-specific fuel price lookup
 * @returns {Promise<Object>} Calculated fuel estimation result
 */
const calculateFuelCostService = async ({ distance, mileage, fuelType, location }) => {
  // 1. Validate distance
  if (distance === undefined || distance === null || distance === "") {
    throw new AppError("Distance is required.", 400);
  }
  const numDistance = Number(distance);
  if (isNaN(numDistance) || !isFinite(numDistance) || numDistance <= 0) {
    throw new AppError("Distance must be a valid positive number greater than 0.", 400);
  }

  // 2. Validate mileage
  if (mileage === undefined || mileage === null || mileage === "") {
    throw new AppError("Mileage is required.", 400);
  }
  const numMileage = Number(mileage);
  if (isNaN(numMileage) || !isFinite(numMileage) || numMileage <= 0) {
    throw new AppError("Mileage must be a valid positive number greater than 0.", 400);
  }

  // 3. Validate fuelType
  if (!fuelType || typeof fuelType !== "string" || !fuelType.trim()) {
    throw new AppError("Fuel type is required.", 400);
  }

  const normalizedFuelType = fuelType.trim().toUpperCase();
  if (normalizedFuelType !== "PETROL" && normalizedFuelType !== "DIESEL") {
    throw new AppError(
      `Unsupported fuel type '${fuelType}'. Supported fuel types are PETROL and DIESEL.`,
      400
    );
  }

  // 4. Lookup reference FuelPrice record from existing FuelPrice collection
  let fuelPriceRecord = null;

  if (location && typeof location === "string" && location.trim().length > 0) {
    const searchTarget = location.trim();
    const regex = new RegExp(searchTarget, "i");

    // Search precedence: Exact location -> Exact city -> Exact state -> Substring match
    fuelPriceRecord = await FuelPrice.findOne({ location: searchTarget, isLatest: true });

    if (!fuelPriceRecord) {
      fuelPriceRecord = await FuelPrice.findOne({ city: searchTarget, isLatest: true });
    }

    if (!fuelPriceRecord) {
      fuelPriceRecord = await FuelPrice.findOne({ state: searchTarget, isLatest: true });
    }

    if (!fuelPriceRecord) {
      fuelPriceRecord = await FuelPrice.findOne({
        $or: [{ location: regex }, { city: regex }, { state: regex }],
        isLatest: true,
      });
    }

    if (!fuelPriceRecord) {
      throw new AppError(`No fuel price data found for location '${searchTarget}'.`, 404);
    }
  } else {
    // Default location lookup: Delhi first, or first available latest price record
    fuelPriceRecord = await FuelPrice.findOne({ location: "Delhi", isLatest: true });
    if (!fuelPriceRecord) {
      fuelPriceRecord = await FuelPrice.findOne({ isLatest: true });
    }
  }

  if (!fuelPriceRecord) {
    throw new AppError("No fuel price reference data available in the system.", 404);
  }

  // 5. Select unit price based on fuel type
  const unitPrice =
    normalizedFuelType === "PETROL"
      ? fuelPriceRecord.petrolPrice
      : fuelPriceRecord.dieselPrice;

  if (unitPrice === undefined || unitPrice === null || unitPrice < 0) {
    throw new AppError(
      `Fuel price for ${normalizedFuelType} is not available for location '${fuelPriceRecord.location}'.`,
      404
    );
  }

  // 6. Perform calculation (internal precision)
  const fuelRequiredExact = numDistance / numMileage;
  const estimatedFuelCostExact = fuelRequiredExact * unitPrice;

  // 7. Round output values to 2 decimal places
  const fuelRequired = Math.round(fuelRequiredExact * 100) / 100;
  const estimatedFuelCost = Math.round(estimatedFuelCostExact * 100) / 100;

  return {
    distance: numDistance,
    mileage: numMileage,
    fuelType: normalizedFuelType,
    fuelPrice: unitPrice,
    fuelRequired,
    estimatedFuelCost,
    location: fuelPriceRecord.location,
  };
};

module.exports = {
  calculateFuelCostService,
};
