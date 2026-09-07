const env = require("../../config/environment");
const AppError = require("../../utils/AppError");

/**
 * Strips HTML tags from Google Directions step instructions
 */
const stripHtml = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string") return "";
  return htmlString
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

/**
 * Geocodes an address string to { lat, lng } using Google Geocoding API
 */
const geocodeLocation = async (addressText) => {
  const apiKey = env.googleMapsApiKey;
  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    throw new AppError(
      "Google Maps API key is not configured on the server.",
      500
    );
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    addressText
  )}&key=${apiKey}`;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new AppError(
      `Failed to connect to Google Geocoding API: ${error.message}`,
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      `Google Geocoding API HTTP error: ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.status === "ZERO_RESULTS" || !data.results || data.results.length === 0) {
    throw new AppError(
      `Could not geocode location '${addressText}'. Please check the place name.`,
      400
    );
  }

  if (data.status === "REQUEST_DENIED") {
    throw new AppError(
      `Google Geocoding API Request Denied: ${data.error_message || ""}`,
      403
    );
  }

  if (data.status === "OVER_QUERY_LIMIT") {
    throw new AppError(
      "Google Geocoding API quota exceeded. Please try again later.",
      429
    );
  }

  const location = data.results[0].geometry.location;
  return {
    lat: location.lat,
    lng: location.lng,
  };
};

/**
 * Calls Google Directions API with departure_time=now for traffic-aware route details
 */
const getRoute = async (originLat, originLng, destLat, destLng) => {
  const apiKey = env.googleMapsApiKey;
  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    throw new AppError(
      "Google Maps API key is not configured on the server.",
      500
    );
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&departure_time=now&key=${apiKey}`;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new AppError(
      `Failed to connect to Google Directions API: ${error.message}`,
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      `Google Directions API HTTP error: ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.status === "ZERO_RESULTS" || !data.routes || data.routes.length === 0) {
    throw new AppError(
      "No driving route found between the specified origin and destination.",
      400
    );
  }

  if (data.status === "NOT_FOUND") {
    throw new AppError(
      "One or more locations could not be geocoded by Google Directions.",
      400
    );
  }

  if (data.status === "REQUEST_DENIED") {
    throw new AppError(
      `Google Directions API Request Denied: ${data.error_message || ""}`,
      403
    );
  }

  if (data.status === "OVER_QUERY_LIMIT") {
    throw new AppError(
      "Google Directions API quota exceeded. Please try again later.",
      429
    );
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  const distanceMeters = leg.distance ? leg.distance.value : 0;
  const durationSeconds = leg.duration ? leg.duration.value : 0;
  const durationInTrafficSeconds = leg.duration_in_traffic
    ? leg.duration_in_traffic.value
    : durationSeconds;
  const polyline = route.overview_polyline ? route.overview_polyline.points : "";

  const steps = (leg.steps || []).map((step) => ({
    instruction: stripHtml(step.html_instructions),
    distanceMeters: step.distance ? step.distance.value : 0,
    durationSeconds: step.duration ? step.duration.value : 0,
  }));

  return {
    distanceMeters,
    durationSeconds,
    durationInTrafficSeconds,
    polyline,
    steps,
    computedAt: new Date(),
  };
};

module.exports = {
  geocodeLocation,
  getRoute,
};
