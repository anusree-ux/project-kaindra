const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");

// In-memory cache for getRouteStats (2 minute TTL = 120,000 ms)
const statsCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Normalizes location strings (lowercased, trimmed)
 * @param {string} text
 * @returns {string}
 */
const normalizeLocation = (text) => {
  if (!text || typeof text !== "string") return "";
  return text.trim().toLowerCase();
};

/**
 * Escapes regex special characters in a string
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Builds case-insensitive, whitespace-trimmed exact match query for origin & destination
 * @param {string} origin
 * @param {string} destination
 * @returns {Object} Mongoose query
 */
const buildLocationQuery = (origin, destination) => {
  const normOrigin = normalizeLocation(origin);
  const normDest = normalizeLocation(destination);

  return {
    origin: new RegExp(`^\\s*${escapeRegex(normOrigin)}\\s*$`, "i"),
    destination: new RegExp(`^\\s*${escapeRegex(normDest)}\\s*$`, "i"),
    status: { $in: ["planning", "ongoing"] },
  };
};

/**
 * Aggregates statistics for rides matching origin and destination
 * Uses 2-minute in-memory caching
 * @param {string} origin
 * @param {string} destination
 * @returns {Promise<Object>} { currentlyRiding, planning, lookingForPartners, totalUniqueRiders }
 */
const getRouteStats = async (origin, destination) => {
  const normOrigin = normalizeLocation(origin);
  const normDest = normalizeLocation(destination);
  const cacheKey = `${normOrigin}:${normDest}`;
  const now = Date.now();

  const cachedEntry = statsCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.data;
  }

  const query = buildLocationQuery(origin, destination);
  const matchingRides = await Ride.find(query);

  if (matchingRides.length === 0) {
    const emptyStats = {
      currentlyRiding: 0,
      planning: 0,
      lookingForPartners: 0,
      totalUniqueRiders: 0,
    };
    statsCache.set(cacheKey, {
      data: emptyStats,
      expiresAt: now + CACHE_TTL_MS,
    });
    return emptyStats;
  }

  const matchingRideIds = matchingRides.map((r) => r._id);
  const confirmedParticipants = await RideParticipant.find({
    rideId: { $in: matchingRideIds },
    status: "confirmed",
  });

  const participantCountsByRide = {};
  for (const p of confirmedParticipants) {
    const rId = p.rideId.toString();
    participantCountsByRide[rId] = (participantCountsByRide[rId] || 0) + 1;
  }

  let currentlyRiding = 0;
  let planning = 0;
  let lookingForPartners = 0;

  for (const ride of matchingRides) {
    if (ride.status === "ongoing") {
      currentlyRiding++;
    } else if (ride.status === "planning") {
      planning++;
      const count = participantCountsByRide[ride._id.toString()] || 0;
      if (count < 3) {
        lookingForPartners++;
      }
    }
  }

  const uniqueUserIds = new Set();
  for (const p of confirmedParticipants) {
    uniqueUserIds.add(p.userId.toString());
  }
  for (const ride of matchingRides) {
    if (ride.organizerId) {
      uniqueUserIds.add(ride.organizerId.toString());
    }
  }

  const stats = {
    currentlyRiding,
    planning,
    lookingForPartners,
    totalUniqueRiders: uniqueUserIds.size,
  };

  statsCache.set(cacheKey, {
    data: stats,
    expiresAt: now + CACHE_TTL_MS,
  });

  return stats;
};

/**
 * Retrieves paginated matching rides, optionally filtered by status
 * @param {string} origin
 * @param {string} destination
 * @param {string} [filterStatus] "riding" | "planning" | "looking_for_partners"
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<Object>} { rides, pagination }
 */
const getRouteMatches = async (
  origin,
  destination,
  filterStatus,
  page = 1,
  limit = 10
) => {
  const query = buildLocationQuery(origin, destination);
  const matchingRides = await Ride.find(query)
    .populate("organizerId", "name email")
    .sort({ startDate: 1 });

  if (matchingRides.length === 0) {
    return {
      rides: [],
      pagination: {
        total: 0,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        totalPages: 0,
      },
    };
  }

  const matchingRideIds = matchingRides.map((r) => r._id);
  const confirmedParticipants = await RideParticipant.find({
    rideId: { $in: matchingRideIds },
    status: "confirmed",
  });

  const participantCountsByRide = {};
  for (const p of confirmedParticipants) {
    const rId = p.rideId.toString();
    participantCountsByRide[rId] = (participantCountsByRide[rId] || 0) + 1;
  }

  const formattedRides = matchingRides.map((ride) => {
    const confirmedCount = participantCountsByRide[ride._id.toString()] || 0;
    return {
      id: ride._id,
      title: ride.title,
      origin: ride.origin,
      destination: ride.destination,
      startDate: ride.startDate,
      status: ride.status,
      distanceKm: ride.distanceKm,
      organizer: {
        id: ride.organizerId?._id || null,
        name: ride.organizerId?.name || "Unknown",
        email: ride.organizerId?.email || null,
      },
      confirmedParticipantCount: confirmedCount,
    };
  });

  const normFilter = filterStatus
    ? String(filterStatus).toLowerCase().trim()
    : null;
  let filtered = formattedRides;

  if (normFilter === "riding") {
    filtered = formattedRides.filter((r) => r.status === "ongoing");
  } else if (normFilter === "planning") {
    filtered = formattedRides.filter((r) => r.status === "planning");
  } else if (normFilter === "looking_for_partners") {
    filtered = formattedRides.filter(
      (r) => r.status === "planning" && r.confirmedParticipantCount < 3
    );
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedRides = filtered.slice(startIndex, startIndex + limitNum);

  return {
    rides: paginatedRides,
    pagination: {
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
    },
  };
};

module.exports = {
  normalizeLocation,
  getRouteStats,
  getRouteMatches,
};
