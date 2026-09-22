const FuelPriceSubmission = require("../../models/mototribe/FuelPriceSubmission");
const FuelPrice = require("../../models/mototribe/FuelPrice");
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

  let isFallback = false;
  let priceSource = "Community 7-Day Median";
  let count = submissions.length;
  let median = null;

  if (submissions.length > 0) {
    const prices = submissions.map((s) => s.pricePerLiter);
    const rawMedian = calculateMedian(prices);
    median = rawMedian !== null ? Math.round(rawMedian * 100) / 100 : null;
    isFallback = false;
    priceSource = `Community 7-Day Median (${submissions.length} reports)`;
  } else {
    // Lookup official state IOCL fuel price from database
    const searchRegex = new RegExp(normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    let record = await FuelPrice.findOne({
      $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
      isLatest: true,
    });
    if (!record) {
      record = await FuelPrice.findOne({
        $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
      });
    }

    if (record) {
      median = normalizedFuelType === "petrol" ? record.petrolPrice : record.dieselPrice;
      isFallback = false;
      priceSource = `Official IOCL ${record.state} Benchmark (Database)`;
    } else {
      median = normalizedFuelType === "petrol" ? 94.72 : 87.62;
      isFallback = true;
      priceSource = "National Default Fallback";
    }
  }

  return {
    state: normalizedState,
    fuelType: normalizedFuelType,
    median,
    count,
    isFallback,
    source: priceSource,
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
const submitFuelPrice = async (userId, state, fuelType, pricePerLiter, station, location) => {
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

  const submissionData = {
    userId,
    state: state.trim(),
    fuelType: normalizedFuelType,
    pricePerLiter: numPrice,
    submittedAt: new Date(),
  };

  if (station && typeof station === "string" && station.trim()) {
    submissionData.station = station.trim();
  }
  if (location && typeof location === "string" && location.trim()) {
    submissionData.location = location.trim();
  }

  const submission = await FuelPriceSubmission.create(submissionData);

  const updatedStats = await getCurrentAverage(state, normalizedFuelType);

  return {
    submission,
    updatedMedian: updatedStats.median,
    count: updatedStats.count,
  };
};

/**
 * Fetch recent community fuel price submissions
 * @param {number} [limit=20]
 * @returns {Promise<Array>}
 */
const getRecentSubmissions = async (limit = 20) => {
  const submissions = await FuelPriceSubmission.find()
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("userId", "name");
  return submissions;
};

/**
 * 3. Estimate fuel cost for distance, vehicle mileage, state, and fuel type
 * Uses stored IOCL state-wise petrol and diesel prices from DB for estimation.
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

  // 1. Primary lookup: Official IOCL state-wise FuelPrice record stored in DB
  const searchRegex = new RegExp(normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  let ioclRecord = await FuelPrice.findOne({
    $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
    isLatest: true,
  });

  if (!ioclRecord) {
    ioclRecord = await FuelPrice.findOne({
      $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
    });
  }

  let pricePerLiter;
  let isFallback = false;
  let priceSource = "IOCL DB";

  if (ioclRecord) {
    pricePerLiter = normalizedFuelType === "petrol" ? ioclRecord.petrolPrice : ioclRecord.dieselPrice;
    isFallback = false;
  } else {
    // 2. Fallback to crowdsourced community submission 7-day average if DB state missing
    const stats = await getCurrentAverage(normalizedState, normalizedFuelType);
    if (stats.count > 0 && stats.median !== null) {
      pricePerLiter = stats.median;
      priceSource = "Community 7-Day Median";
    } else {
      // 3. Fallback to national default
      pricePerLiter = normalizedFuelType === "petrol" ? 94.72 : 87.62;
      isFallback = true;
      priceSource = "National Default";
    }
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
    priceSource,
    isFallback,
    note: `Estimated using official IOCL state-wise DB rate (₹${pricePerLiter}/L for ${normalizedFuelType}) for state '${normalizedState}'.`,
  };
};

module.exports = {
  getCurrentAverage,
  submitFuelPrice,
  estimateFuelCost,
  getRecentSubmissions,
};
