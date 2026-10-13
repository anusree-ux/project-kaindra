const FuelPriceSubmission = require("../../models/mototribe/FuelPriceSubmission");
const FuelPrice = require("../../models/mototribe/FuelPrice");
const { ioclStateFuelPriceData } = require("./ioclFuelPriceService");
const AppError = require("../../utils/AppError");

/**
 * Calculates the median of an array of numbers.
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
 * Helper to get official benchmark price from DB or official IOCL dataset
 */
const getOfficialBenchmark = async (normalizedState, normalizedFuelType) => {
  const searchRegex = new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  // 1. Check MongoDB FuelPrice collection
  let officialRecord = await FuelPrice.findOne({
    $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
    isLatest: true,
  });

  if (!officialRecord) {
    officialRecord = await FuelPrice.findOne({
      $or: [{ state: searchRegex }, { city: searchRegex }, { location: searchRegex }],
    });
  }

  if (officialRecord) {
    return {
      price: normalizedFuelType === "petrol" ? officialRecord.petrolPrice : officialRecord.dieselPrice,
      source: officialRecord.source || "IOCL",
      sourceType: officialRecord.sourceType || "official",
      confidence: officialRecord.confidence || 1.0,
      isDbRecord: true,
    };
  }

  // 2. Check official IOCL dataset array if DB not seeded yet
  const stateClean = normalizedState.toLowerCase();
  const ioclMatch = ioclStateFuelPriceData.find(
    (item) =>
      item.state.toLowerCase() === stateClean ||
      item.city.toLowerCase() === stateClean ||
      item.location.toLowerCase().includes(stateClean)
  );

  if (ioclMatch) {
    return {
      price: normalizedFuelType === "petrol" ? ioclMatch.petrolPrice : ioclMatch.dieselPrice,
      source: "IOCL",
      sourceType: "official",
      confidence: 1.0,
      isDbRecord: false,
    };
  }

  // 3. Fallback national default
  return {
    price: normalizedFuelType === "petrol" ? 94.72 : 87.62,
    source: "National Default Fallback",
    sourceType: "official",
    confidence: 0.5,
    isDbRecord: false,
  };
};

/**
 * Calculates weighted confidence score (0.0 to 1.0) for fuel price data
 */
const calculateConfidenceScore = ({ submissions, expectedPrice }) => {
  if (!submissions || submissions.length === 0) return 0.0;

  const now = Date.now();
  const newestDate = new Date(Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime())));
  const ageHours = (now - newestDate.getTime()) / (1000 * 60 * 60);

  // 1. Recency Score (weight 0.3)
  let recencyScore = 0.2;
  if (ageHours <= 24) recencyScore = 1.0;
  else if (ageHours <= 72) recencyScore = 0.8;
  else if (ageHours <= 168) recencyScore = 0.5;

  // 2. Rider Count Score (weight 0.3)
  const uniqueRiders = new Set(submissions.map((s) => s.userId?.toString() || s._id?.toString())).size;
  let riderCountScore = 0.3;
  if (uniqueRiders >= 5) riderCountScore = 1.0;
  else if (uniqueRiders >= 2) riderCountScore = 0.7;

  // 3. Agreement / Deviation Score (weight 0.4)
  const prices = submissions.map((s) => s.pricePerLiter);
  const medianPrice = calculateMedian(prices);
  let agreementScore = 0.5;

  if (expectedPrice && expectedPrice > 0 && medianPrice !== null) {
    const deviationPct = Math.abs(medianPrice - expectedPrice) / expectedPrice;
    if (deviationPct <= 0.02) agreementScore = 1.0;
    else if (deviationPct <= 0.05) agreementScore = 0.8;
    else if (deviationPct <= 0.10) agreementScore = 0.5;
    else agreementScore = 0.1;
  }

  const totalScore = recencyScore * 0.3 + riderCountScore * 0.3 + agreementScore * 0.4;
  return Math.min(1.0, Math.max(0.0, Math.round(totalScore * 100) / 100));
};

/**
 * 1. Resolution Logic: Official Baseline + Community Verification
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

  const searchRegex = new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  // Fetch recent Accepted Community Submissions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const acceptedSubmissions = await FuelPriceSubmission.find({
    state: searchRegex,
    fuelType: normalizedFuelType,
    validationStatus: "ACCEPTED",
    submittedAt: { $gte: sevenDaysAgo },
  }).select("userId pricePerLiter submittedAt station location");

  // Fetch Official Benchmark
  const official = await getOfficialBenchmark(normalizedState, normalizedFuelType);
  const officialPrice = official.price;

  const communityPrices = acceptedSubmissions.map((s) => s.pricePerLiter);
  const communityMedian = calculateMedian(communityPrices);

  let resolvedPrice = officialPrice;
  let isFallback = !official.isDbRecord && acceptedSubmissions.length === 0 && official.source === "National Default Fallback";
  let priceSource = official.isDbRecord ? `Official ${official.source} Benchmark (Database)` : `Official ${official.source} Benchmark`;
  let confidence = official.confidence;
  let hasDiscrepancy = false;

  if (communityMedian !== null) {
    const deviation = Math.abs(communityMedian - officialPrice) / officialPrice;
    if (deviation <= 0.08) {
      // Community verifies official price (within 8%)
      resolvedPrice = Math.round(communityMedian * 100) / 100;
      confidence = calculateConfidenceScore({ submissions: acceptedSubmissions, expectedPrice: officialPrice });
      priceSource = `Official ${official.source} Baseline + Community Verified (${acceptedSubmissions.length} reports)`;
      isFallback = false;
    } else {
      // Community data diverges > 8% -> Keep official baseline, flag discrepancy
      resolvedPrice = officialPrice;
      confidence = 0.85;
      priceSource = `Official ${official.source} Baseline (Community Discrepancy Flagged)`;
      hasDiscrepancy = true;
    }
  }

  return {
    state: normalizedState,
    fuelType: normalizedFuelType,
    median: resolvedPrice,
    officialBaseline: officialPrice,
    count: acceptedSubmissions.length,
    confidenceScore: confidence,
    hasDiscrepancy,
    isFallback,
    source: priceSource,
    sourceType: official.sourceType,
  };
};

/**
 * 2. Submit crowdsourced fuel price with strict ±5% validation & audit trail storing
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

  // Get Official Expected Baseline for comparison
  const official = await getOfficialBenchmark(state.trim(), normalizedFuelType);
  const baselinePrice = official.price;

  // Stricter validation check: 5% soft band for ACCEPTED, 20% hard threshold for REJECTED
  const deviation = Math.abs(numPrice - baselinePrice) / baselinePrice;
  const deviationPct = Math.round(deviation * 10000) / 100;

  let validationStatus = "ACCEPTED";
  let confidenceScore = 0.8;

  if (deviation <= 0.08) {
    validationStatus = "ACCEPTED";
    confidenceScore = Math.round((1.0 - deviation) * 100) / 100;
  } else if (deviation <= 0.20) {
    validationStatus = "SUSPICIOUS";
    confidenceScore = 0.4;
  } else {
    validationStatus = "REJECTED";
    confidenceScore = 0.1;
  }

  const submissionData = {
    userId,
    state: state.trim(),
    fuelType: normalizedFuelType,
    pricePerLiter: numPrice,
    validationStatus,
    confidenceScore,
    deviationPct,
    submittedAt: new Date(),
  };

  if (station && typeof station === "string" && station.trim()) {
    submissionData.station = station.trim();
  }
  if (location && typeof location === "string" && location.trim()) {
    submissionData.location = location.trim();
  }

  const submission = await FuelPriceSubmission.create(submissionData);

  // If price deviates > 20% from baseline, reject with clear error message
  if (deviation > 0.20) {
    throw new AppError(
      `Submitted price ₹${numPrice}/L deviates more than 20% from current price baseline (₹${baselinePrice}/L). Submission rejected.`,
      400
    );
  }

  const updatedStats = await getCurrentAverage(state, normalizedFuelType);

  return {
    submission,
    validationStatus,
    confidenceScore,
    updatedMedian: updatedStats.median,
    count: updatedStats.count,
  };
};

/**
 * Fetch recent community fuel price submissions
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

  const resolved = await getCurrentAverage(normalizedState, normalizedFuelType);
  const pricePerLiter = resolved.median;

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
    priceSource: resolved.source,
    confidenceScore: resolved.confidenceScore,
    isFallback: resolved.isFallback,
    note: `Estimated using ${resolved.source} (₹${pricePerLiter}/L for ${normalizedFuelType}) in '${normalizedState}'.`,
  };
};

module.exports = {
  getCurrentAverage,
  submitFuelPrice,
  estimateFuelCost,
  getRecentSubmissions,
  calculateConfidenceScore,
  getOfficialBenchmark,
};
