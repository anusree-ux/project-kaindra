const env = require("../../config/environment");
const AppError = require("../../utils/AppError");

// In-memory cache storage & TTL (30 minutes = 1,800,000 ms)
const weatherCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Fetches current weather and 5-day forecast from OpenWeatherMap API with 30-min in-memory cache
 * @param {number|string} latitude
 * @param {number|string} longitude
 */
const getWeather = async (latitude, longitude) => {
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (isNaN(latNum) || isNaN(lngNum)) {
    throw new AppError("Invalid latitude or longitude provided.", 400);
  }

  // Cache key: rounded to 2 decimal places (~1.1 km accuracy)
  const latRounded = latNum.toFixed(2);
  const lngRounded = lngNum.toFixed(2);
  const cacheKey = `${latRounded},${lngRounded}`;

  const now = Date.now();
  const cachedEntry = weatherCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    console.log(`[WeatherCache HIT] Returning cached weather for ${cacheKey}`);
    return {
      ...cachedEntry.data,
      fromCache: true,
    };
  }

  console.log(`[WeatherCache MISS] Querying OpenWeatherMap API for ${cacheKey}`);

  const apiKey = env.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your_openweather_api_key_here") {
    throw new AppError(
      "OpenWeatherMap API key is not configured on the server.",
      500
    );
  }

  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lngNum}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lngNum}&units=metric&appid=${apiKey}`;

  let currentRes, forecastRes;
  try {
    [currentRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);
  } catch (error) {
    throw new AppError(
      `Failed to connect to OpenWeatherMap service: ${error.message}`,
      502
    );
  }

  if (!currentRes.ok) {
    if (currentRes.status === 401) {
      throw new AppError("OpenWeatherMap API Key is invalid or unauthenticated.", 401);
    }
    if (currentRes.status === 429) {
      throw new AppError("OpenWeatherMap API rate limit exceeded.", 429);
    }
    throw new AppError(
      `OpenWeatherMap Current Weather API error: ${currentRes.statusText}`,
      currentRes.status
    );
  }

  if (!forecastRes.ok) {
    if (forecastRes.status === 401) {
      throw new AppError("OpenWeatherMap API Key is invalid or unauthenticated.", 401);
    }
    if (forecastRes.status === 429) {
      throw new AppError("OpenWeatherMap API rate limit exceeded.", 429);
    }
    throw new AppError(
      `OpenWeatherMap Forecast API error: ${forecastRes.statusText}`,
      forecastRes.status
    );
  }

  const currentData = await currentRes.json();
  const forecastData = await forecastRes.json();

  // Clean current weather object
  const currentWeather = currentData.weather?.[0] || {};
  const currentCleaned = {
    tempCelsius: currentData.main?.temp ?? null,
    condition: currentWeather.main || "Unknown",
    description: currentWeather.description || "",
    humidity: currentData.main?.humidity ?? null,
    windSpeedKmh: currentData.wind?.speed
      ? Math.round(currentData.wind.speed * 3.6 * 10) / 10
      : null,
    icon: currentWeather.icon || "",
  };

  // Clean forecast (take up to 5 entries)
  const forecastCleaned = (forecastData.list || []).slice(0, 5).map((item) => {
    const weatherItem = item.weather?.[0] || {};
    return {
      datetime: item.dt_txt || "",
      tempCelsius: item.main?.temp ?? null,
      condition: weatherItem.main || "Unknown",
      icon: weatherItem.icon || "",
    };
  });

  const cleanedResult = {
    current: currentCleaned,
    forecast: forecastCleaned,
  };

  // Store in cache
  weatherCache.set(cacheKey, {
    data: cleanedResult,
    expiresAt: now + CACHE_TTL_MS,
  });

  return {
    ...cleanedResult,
    fromCache: false,
  };
};

module.exports = {
  getWeather,
};
