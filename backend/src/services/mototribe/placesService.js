const env = require("../../config/environment");
const AppError = require("../../utils/AppError");

// Category mapping to Google Places type parameters
const CATEGORY_MAP = {
  fuel: "gas_station",
  hospital: "hospital",
  repair_shop: "car_repair",
  hotel: "lodging",
  food: "restaurant",
  rest_stop: "cafe",
  scenic_spot: "tourist_attraction",
};

// In-memory cache storage & TTL (5 minutes = 300,000 ms)
const placesCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Fetches nearby places using Google Places Nearby Search API with server-side caching
 */
const getNearbyPlaces = async (
  latitude,
  longitude,
  category,
  radiusMeters = 5000
) => {
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const radiusNum = parseInt(radiusMeters, 10) || 5000;

  const googleType = CATEGORY_MAP[category];
  if (!googleType) {
    throw new AppError(
      `Invalid category '${category}'. Allowed categories: ${Object.keys(
        CATEGORY_MAP
      ).join(", ")}.`,
      400
    );
  }

  // Generate cache key (coordinates rounded to 3 decimal places ~110m accuracy)
  const latRounded = latNum.toFixed(3);
  const lngRounded = lngNum.toFixed(3);
  const cacheKey = `${latRounded},${lngRounded}:${category}:${radiusNum}`;

  const now = Date.now();
  const cachedEntry = placesCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    console.log(`[PlacesCache HIT] Returning cached data for ${cacheKey}`);
    return {
      places: cachedEntry.data,
      fromCache: true,
    };
  }

  console.log(`[PlacesCache MISS] Querying Google API for ${cacheKey}`);

  const apiKey = env.googleMapsApiKey;
  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    throw new AppError(
      "Google Maps API key is not configured on the server.",
      500
    );
  }

  const googleApiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latNum},${lngNum}&radius=${radiusNum}&type=${googleType}&key=${apiKey}`;

  let response;
  try {
    response = await fetch(googleApiUrl);
  } catch (error) {
    throw new AppError(
      `Failed to connect to Google Places API: ${error.message}`,
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      `Google Places API HTTP error: ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.status === "REQUEST_DENIED") {
    throw new AppError(
      `Google Places API Request Denied: ${data.error_message || "Invalid or unauthenticated API key."}`,
      403
    );
  }

  if (data.status === "OVER_QUERY_LIMIT") {
    throw new AppError(
      "Google Places API quota exceeded. Please try again later.",
      429
    );
  }

  if (data.status === "INVALID_REQUEST") {
    throw new AppError(
      `Invalid request sent to Google Places API: ${data.error_message || ""}`,
      400
    );
  }

  const results = data.results || [];

  // Clean and transform Google Places payload
  const cleanedPlaces = results.map((place) => {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;

    const distanceMeters =
      placeLat !== undefined && placeLng !== undefined
        ? calculateHaversineDistance(latNum, lngNum, placeLat, placeLng)
        : null;

    return {
      name: place.name || "Unknown Place",
      address: place.vicinity || place.formatted_address || "",
      latitude: placeLat,
      longitude: placeLng,
      rating: place.rating || null,
      isOpenNow: place.opening_hours?.open_now ?? null,
      distanceMeters,
      googlePlaceId: place.place_id,
    };
  });

  // Sort places by distance
  cleanedPlaces.sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
  );

  // Store in cache
  placesCache.set(cacheKey, {
    data: cleanedPlaces,
    expiresAt: now + CACHE_TTL_MS,
  });

  return {
    places: cleanedPlaces,
    fromCache: false,
  };
};

module.exports = {
  getNearbyPlaces,
  CATEGORY_MAP,
};
