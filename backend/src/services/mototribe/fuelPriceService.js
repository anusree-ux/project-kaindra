const FuelPriceSubmission = require("../../models/mototribe/FuelPriceSubmission");
const AppError = require("../../utils/AppError");

/**
 * Calculates the median of an array of numbers.
 * @param {number[]} numbers
 * @returns {number|null}
 */
const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

/**
 * 1. Get current 7-day median fuel price for state + fuelType
 *
 * @param {string} state - State name (e.g. "Maharashtra")
 * @param {string} fuelType - Fuel type ("petrol" | "diesel")
 * @returns {Promise<Object>} Object containing state, fuelType, median, count, and isFallback
 */
const getCurrentAverage = async (state, fuelType) => {
  if (!state || typeof state !== "string" || !state.trim()) {
    throw new AppError("State name is required.", 400);
  }

  if (!fuelType || typeof fuelType !== "string" || !fuelType.trim()) {
    throw new AppError("Fuel type is required (petrol or diesel).", 400);
  }

  const normalizedState = state.trim();
  const normalizedFuelType = fuelType.trim().toLowerCase();

  if (!["petrol", "diesel"].includes(normalizedFuelType)) {
    throw new AppError("Fuel type must be either 'petrol' or 'diesel'.", 400);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const submissions = await FuelPriceSubmission.find({
    state: new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    fuelType: normalizedFuelType,
    submittedAt: { $gte: sevenDaysAgo },
  }).select("pricePerLiter");

  const prices = submissions.map((s) => s.pricePerLiter);
  const rawMedian = calculateMedian(prices);
  const median = rawMedian !== null ? Math.round(rawMedian * 100) / 100 : null;

  return {
    state: normalizedState,
    fuelType: normalizedFuelType,
    median,
    count: submissions.length,
    isFallback: submissions.length === 0,
  };
};

/**
 * 2. Submit crowdsourced fuel price with bootstrap check (< 3 submissions) and 20% outlier rejection
 *
 * @param {string} userId - ID of submitting user
 * @param {string} state - State name
 * @param {string} fuelType - Fuel type ("petrol" | "diesel")
 * @param {number} pricePerLiter - Price per liter in INR
 * @returns {Promise<Object>} Object containing saved submission and updated median
 */
const submitFuelPrice = async (userId, state, fuelType, pricePerLiter) => {
  if (!state || !fuelType || pricePerLiter === undefined || pricePerLiter === null) {
    throw new AppError("state, fuelType, and pricePerLiter are required.", 400);
  }

  const numPrice = Number(pricePerLiter);
  if (isNaN(numPrice) || !isFinite(numPrice) || numPrice <= 0) {
    throw new AppError("pricePerLiter must be a valid positive number.", 400);
  }

  const normalizedFuelType = fuelType.trim().toLowerCase();
  if (!["petrol", "diesel"].includes(normalizedFuelType)) {
    throw new AppError("Fuel type must be either 'petrol' or 'diesel'.", 400);
  }

  const currentStats = await getCurrentAverage(state, normalizedFuelType);

  // Bootstrap rule: If fewer than 3 submissions exist, accept unconditionally.
  // Otherwise, reject if the new price deviates by more than 20% from the current median.
  if (currentStats.count >= 3 && currentStats.median !== null) {
    const deviation = Math.abs(numPrice - currentStats.median) / currentStats.median;
    if (deviation > 0.20) {
      throw new AppError(
        `Submitted price ₹${numPrice}/L deviates more than 20% from the current state median (₹${currentStats.median}/L). Submission rejected.`,
        400
      );
    }
  }

  const submission = await FuelPriceSubmission.create({
    userId,
    state: state.trim(),
    fuelType: normalizedFuelType,
    pricePerLiter: numPrice,
    submittedAt: new Date(),
  });

  const updatedStats = await getCurrentAverage(state, normalizedFuelType);

  return {
    submission,
    updatedMedian: updatedStats.median,
    count: updatedStats.count,
  };
};

/**
 * 3. Estimate fuel cost for distance, vehicle mileage, state, and fuel type
 *
 * @param {number} distanceKm - Total distance in km
 * @param {number} vehicleMileageKmpl - Vehicle mileage in km/L
 * @param {string} [state='Delhi'] - Target state
 * @param {string} [fuelType='petrol'] - Fuel type ("petrol" | "diesel")
 * @returns {Promise<Object>} Calculated fuel estimation result
 */
const estimateFuelCost = async (distanceKm, vehicleMileageKmpl, state, fuelType) => {
  const numDistance = Number(distanceKm);
  const numMileage = Number(vehicleMileageKmpl);

  if (isNaN(numDistance) || !isFinite(numDistance) || numDistance <= 0) {
    throw new AppError("distanceKm must be a positive number greater than 0.", 400);
  }
  if (isNaN(numMileage) || !isFinite(numMileage) || numMileage <= 0) {
    throw new AppError("vehicleMileageKmpl must be a positive number greater than 0.", 400);
  }

  const normalizedState = state && typeof state === "string" && state.trim() ? state.trim() : "Delhi";
  const normalizedFuelType = fuelType && typeof fuelType === "string" && fuelType.trim() ? fuelType.trim().toLowerCase() : "petrol";

  const stats = await getCurrentAverage(normalizedState, normalizedFuelType);

  let pricePerLiter;
  let isFallback = false;

  if (stats.count > 0 && stats.median !== null) {
    pricePerLiter = stats.median;
    isFallback = false;
  } else {
    // Hardcoded national default fallback (~₹105/L petrol, ~₹95/L diesel)
    pricePerLiter = normalizedFuelType === "petrol" ? 105.0 : 95.0;
    isFallback = true;
  }

  const fuelRequiredExact = numDistance / numMileage;
  const estimatedFuelCostExact = fuelRequiredExact * pricePerLiter;

  const fuelRequired = Math.round(fuelRequiredExact * 100) / 100;
  const estimatedFuelCost = Math.round(estimatedFuelCostExact * 100) / 100;

  return {
    distanceKm: numDistance,
    vehicleMileageKmpl: numMileage,
    state: normalizedState,
    fuelType: normalizedFuelType,
    pricePerLiter,
    fuelRequired,
    estimatedFuelCost,
    submissionCount: stats.count,
    isFallback,
    note: isFallback
      ? `Using national default fallback price (₹${pricePerLiter}/L). No community submissions available yet for state '${normalizedState}'.`
      : `Calculated using 7-day community median price (₹${pricePerLiter}/L) from ${stats.count} submission(s).`,
  };
};

module.exports = {
  getCurrentAverage,
  submitFuelPrice,
  estimateFuelCost,
};
