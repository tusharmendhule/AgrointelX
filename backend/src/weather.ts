import { WeatherData } from "./types";

/**
 * In-memory weather cache to avoid redundant API calls.
 * Key: "lat,lon" string. Value: { data, timestamp }.
 */
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for current weather
const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for forecast

/**
 * Reverse geocode coordinates to a readable location string.
 * Uses Open-Meteo geocoding API (free, no key needed).
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
    // Open-Meteo doesn't have reverse geocoding, use a fallback approach
    // Use nominatim (OpenStreetMap) for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "User-Agent": "AgroIntelX/1.0" } }
    );
    if (!response.ok) throw new Error("Reverse geocoding failed");
    const data = await response.json() as any;
    const addr = data.address || {};
    const parts = [addr.city || addr.town || addr.village || addr.county, addr.state, addr.country].filter(Boolean);
    return parts.join(", ") || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }
}

/**
 * Forward geocode a location string to coordinates.
 * Uses Open-Meteo geocoding API (free, no key needed).
 */
export async function forwardGeocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    if (!response.ok) throw new Error("Forward geocoding failed");
    const data = await response.json() as any;
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return {
        lat: r.latitude,
        lon: r.longitude,
        name: [r.name, r.admin1, r.country].filter(Boolean).join(", ")
      };
    }
    return null;
  } catch (err) {
    console.error("Forward geocode error:", err);
    return null;
  }
}

/**
 * Convert a location string to coordinates using known Indian farming regions
 * or fall back to geocoding.
 */
async function resolveCoordinates(locationString?: string, lat?: number, lon?: number): Promise<{ lat: number; lon: number }> {
  // If explicit coordinates provided, use them directly
  if (lat !== undefined && lon !== undefined) {
    return { lat, lon };
  }

  if (!locationString) {
    return { lat: 31.3260, lon: 75.5762 }; // Default: Punjab, India
  }

  const loc = locationString.toLowerCase();

  // Quick lookup for common Indian farming regions
  const regionMap: Record<string, { lat: number; lon: number }> = {
    "haryana": { lat: 29.0588, lon: 76.0856 },
    "punjab": { lat: 31.3260, lon: 75.5762 },
    "maharashtra": { lat: 19.7515, lon: 75.7139 },
    "pune": { lat: 18.5204, lon: 73.8567 },
    "nagpur": { lat: 21.1458, lon: 79.0882 },
    "mumbai": { lat: 19.0760, lon: 72.8777 },
    "karnataka": { lat: 15.3173, lon: 75.7139 },
    "bangalore": { lat: 12.9716, lon: 77.5946 },
    "andhra": { lat: 15.9129, lon: 79.7400 },
    "hyderabad": { lat: 17.3850, lon: 78.4867 },
    "tamil": { lat: 11.1271, lon: 78.6569 },
    "chennai": { lat: 13.0827, lon: 80.2707 },
    "rajasthan": { lat: 27.0238, lon: 74.2179 },
    "uttar pradesh": { lat: 26.8467, lon: 80.9462 },
    "madhya pradesh": { lat: 22.9734, lon: 78.6569 },
    "gujarat": { lat: 22.2587, lon: 71.1924 },
    "west bengal": { lat: 22.9868, lon: 87.8550 },
    "bihar": { lat: 25.0961, lon: 85.3131 },
    "odisha": { lat: 20.9517, lon: 85.0985 },
    "chhattisgarh": { lat: 21.2787, lon: 81.8661 },
    "jharkhand": { lat: 23.6102, lon: 85.2799 },
    "assam": { lat: 26.2006, lon: 92.9376 },
    "kerala": { lat: 10.8505, lon: 76.2711 },
    "telangana": { lat: 18.1124, lon: 79.0193 },
    "california": { lat: 36.7783, lon: -119.4179 },
    "us": { lat: 36.7783, lon: -119.4179 },
  };

  for (const [key, coords] of Object.entries(regionMap)) {
    if (loc.includes(key)) {
      return coords;
    }
  }

  // Fall back to geocoding API
  const geoResult = await forwardGeocode(locationString);
  if (geoResult) {
    return { lat: geoResult.lat, lon: geoResult.lon };
  }

  return { lat: 31.3260, lon: 75.5762 }; // Default Punjab
}

/**
 * WMO Weather Code interpretation
 */
const codeMap: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Depositing Rime Fog",
  51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
  56: "Freezing Drizzle", 57: "Heavy Freezing Drizzle",
  61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
  66: "Freezing Rain", 67: "Heavy Freezing Rain",
  71: "Slight Snowfall", 73: "Moderate Snowfall", 75: "Heavy Snowfall",
  77: "Snow Grains",
  80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
  85: "Slight Snow Showers", 86: "Heavy Snow Showers",
  95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail"
};

/**
 * Get weather condition emoji
 */
export function getWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunderstorm")) return "⛈️";
  if (c.includes("heavy rain") || c.includes("violent")) return "🌧️";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "🌦️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("fog")) return "🌫️";
  if (c.includes("overcast")) return "☁️";
  if (c.includes("cloudy")) return "⛅";
  if (c.includes("clear") || c.includes("mainly clear")) return "☀️";
  return "🌤️";
}

/**
 * Calculate agricultural weather risk score (0-100)
 * Higher score = more risk for farming operations
 */
export function calculateWeatherRisk(weather: WeatherData): {
  score: number;
  label: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Heavy rainfall risk
  if (weather.precipitation > 20) { score += 25; factors.push("Heavy rainfall expected"); }
  else if (weather.precipitation > 10) { score += 15; factors.push("Moderate rainfall expected"); }
  else if (weather.precipitation > 5) { score += 5; factors.push("Light rainfall expected"); }

  // Temperature extremes
  if (weather.temp > 42) { score += 20; factors.push("Extreme heat (above 42°C)"); }
  else if (weather.temp > 38) { score += 12; factors.push("High temperature stress"); }
  else if (weather.temp < 5) { score += 15; factors.push("Frost risk (below 5°C)"); }
  else if (weather.temp < 10) { score += 8; factors.push("Cold stress conditions"); }

  // Wind risk
  if (weather.windSpeed > 40) { score += 20; factors.push("Dangerous wind speeds"); }
  else if (weather.windSpeed > 25) { score += 10; factors.push("Strong winds affecting spray/drifting"); }

  // Humidity risk
  if (weather.humidity > 90) { score += 10; factors.push("Very high humidity - fungal risk"); }
  else if (weather.humidity > 80) { score += 5; factors.push("Elevated humidity levels"); }

  // Drought conditions (low humidity + no rain + high temp)
  if (weather.humidity < 30 && weather.precipitation === 0 && weather.temp > 35) {
    score += 10;
    factors.push("Drought conditions developing");
  }

  const clampedScore = Math.min(100, Math.max(0, score));

  let label: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  if (clampedScore <= 20) label = "LOW";
  else if (clampedScore <= 50) label = "MODERATE";
  else if (clampedScore <= 75) label = "HIGH";
  else label = "CRITICAL";

  return { score: clampedScore, label, factors };
}

/**
 * Generate agricultural recommendations based on weather
 */
export function generateFarmRecommendations(weather: WeatherData): Array<{
  category: "irrigation" | "spraying" | "fertilizer" | "harvest" | "field" | "disease";
  icon: string;
  title: string;
  message: string;
  urgency: "positive" | "caution" | "warning";
}> {
  const recs: Array<{
    category: "irrigation" | "spraying" | "fertilizer" | "harvest" | "field" | "disease";
    icon: string;
    title: string;
    message: string;
    urgency: "positive" | "caution" | "warning";
  }> = [];

  // Irrigation recommendation
  if (weather.precipitation > 5 || (weather.forecast.length > 0 && weather.forecast[0].precipitation > 5)) {
    recs.push({
      category: "irrigation",
      icon: "💧",
      title: "Irrigation",
      message: "Irrigation can be postponed. Rainfall is expected.",
      urgency: "positive"
    });
  } else if (weather.temp > 35 && weather.humidity < 40) {
    recs.push({
      category: "irrigation",
      icon: "💧",
      title: "Irrigation",
      message: "Irrigation recommended. High temperature and low rainfall expected.",
      urgency: "warning"
    });
  } else {
    recs.push({
      category: "irrigation",
      icon: "💧",
      title: "Irrigation",
      message: "Standard irrigation schedule can be maintained.",
      urgency: "positive"
    });
  }

  // Spraying recommendation
  if (weather.windSpeed > 20) {
    recs.push({
      category: "spraying",
      icon: "🧪",
      title: "Spraying",
      message: "Avoid pesticide spraying. Wind speed is too high for effective application.",
      urgency: "warning"
    });
  } else if (weather.precipitation > 2 || (weather.forecast.length > 0 && weather.forecast[0].precipitation > 3)) {
    recs.push({
      category: "spraying",
      icon: "🧪",
      title: "Spraying",
      message: "Avoid spraying. Rainfall expected within hours may wash off chemicals.",
      urgency: "warning"
    });
  } else {
    recs.push({
      category: "spraying",
      icon: "🧪",
      title: "Spraying",
      message: "Weather conditions are suitable for spraying.",
      urgency: "positive"
    });
  }

  // Fertilizer recommendation
  if (weather.precipitation > 10 || (weather.forecast.length > 1 && weather.forecast[1].precipitation > 10)) {
    recs.push({
      category: "fertilizer",
      icon: "🌱",
      title: "Fertilizer",
      message: "Avoid fertilizer application before expected heavy rainfall.",
      urgency: "warning"
    });
  } else {
    recs.push({
      category: "fertilizer",
      icon: "🌱",
      title: "Fertilizer",
      message: "Good conditions for fertilizer application.",
      urgency: "positive"
    });
  }

  // Harvest recommendation
  const next2DaysDry = weather.forecast.length >= 2 &&
    weather.forecast[0].precipitation < 2 &&
    weather.forecast[1].precipitation < 2;

  if (next2DaysDry) {
    recs.push({
      category: "harvest",
      icon: "🌾",
      title: "Harvest",
      message: "Good harvesting conditions expected for the next 2 days.",
      urgency: "positive"
    });
  } else if (weather.forecast.length > 0 && weather.forecast[0].precipitation > 5) {
    recs.push({
      category: "harvest",
      icon: "🌾",
      title: "Harvest",
      message: "Consider harvesting before expected rainfall.",
      urgency: "caution"
    });
  } else {
    recs.push({
      category: "harvest",
      icon: "🌾",
      title: "Harvest",
      message: "Monitor forecast before scheduling harvest operations.",
      urgency: "caution"
    });
  }

  // Field work
  if (weather.temp > 20 && weather.temp < 38 && weather.windSpeed < 25 && weather.precipitation < 3) {
    recs.push({
      category: "field",
      icon: "🚜",
      title: "Field Work",
      message: "Suitable weather for field preparation and operations.",
      urgency: "positive"
    });
  } else {
    recs.push({
      category: "field",
      icon: "🚜",
      title: "Field Work",
      message: "Postpone field operations due to adverse weather conditions.",
      urgency: "caution"
    });
  }

  // Disease risk
  if (weather.humidity > 80 && weather.temp > 20 && weather.temp < 35) {
    recs.push({
      category: "disease",
      icon: "🔍",
      title: "Disease Alert",
      message: "High humidity and moderate temperature may increase fungal disease risk. Inspect crops.",
      urgency: "warning"
    });
  } else {
    recs.push({
      category: "disease",
      icon: "🔍",
      title: "Disease Check",
      message: "Low disease pressure under current conditions. Continue regular monitoring.",
      urgency: "positive"
    });
  }

  return recs;
}

/**
 * Fetches real meteorological data from Open-Meteo API.
 * Supports both string-based location and lat/lon coordinates.
 * Implements in-memory caching.
 */
export async function getWeatherData(
  locationString?: string,
  lat?: number,
  lon?: number
): Promise<WeatherData> {
  // Resolve coordinates
  const coords = await resolveCoordinates(locationString, lat, lon);
  const cacheKey = `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
      `&timezone=auto&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with status ${response.status}`);
    }
    const data = await response.json() as any;

    const curr = data.current;
    const daily = data.daily;

    const condition = codeMap[curr.weather_code] || "Overcast";

    // Soil parameters estimated from weather
    const soilMoisture = Math.min(95, Math.max(10,
      Math.round(55 + (curr.precipitation * 15) - (curr.temperature_2m > 30 ? 15 : 0))
    ));
    const soilTemp = Math.round(curr.temperature_2m - 1.5);

    // Build 7-day forecast
    const forecast = [];
    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
      forecast.push({
        date: daily.time[i],
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        condition: codeMap[daily.weather_code[i]] || "Partly Cloudy",
        precipitation: daily.precipitation_sum[i] || 0
      });
    }

    const weatherData: WeatherData = {
      temp: Math.round(curr.temperature_2m),
      humidity: Math.round(curr.relative_humidity_2m),
      windSpeed: Math.round(curr.wind_speed_10m),
      condition,
      precipitation: curr.precipitation || 0,
      soilMoisture,
      soilTemp,
      forecast,
      // Extended fields
      feelsLike: Math.round(curr.apparent_temperature),
      windDirection: curr.wind_direction_10m || 0,
      uvIndex: curr.uv_index || 0,
      pressure: curr.surface_pressure || 1013,
      visibility: 10, // Default good visibility
      sunrise: daily.sunrise?.[0] || "",
      sunset: daily.sunset?.[0] || "",
      rainProbability: daily.precipitation_probability_max?.[0] || 0,
      location: locationString || "Unknown",
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    return weatherData;
  } catch (err) {
    console.error("Failed to fetch live weather, returning fallback:", err);
    return getLocalWeatherFallback(locationString);
  }
}

function getLocalWeatherFallback(locationString?: string): WeatherData {
  const baseTemp = 32;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return {
    temp: baseTemp,
    humidity: 68,
    windSpeed: 14,
    condition: "Partly Cloudy",
    precipitation: 2.5,
    soilMoisture: 42,
    soilTemp: 30,
    feelsLike: 34,
    windDirection: 180,
    uvIndex: 6,
    pressure: 1012,
    visibility: 10,
    sunrise: "06:15",
    sunset: "18:45",
    rainProbability: 30,
    location: locationString || "Punjab, India",
    lastUpdated: new Date().toISOString(),
    forecast: [
      { date: days[0], tempMax: 34, tempMin: 26, condition: "Partly Cloudy", precipitation: 2.0 },
      { date: days[1], tempMax: 35, tempMin: 27, condition: "Mainly Clear", precipitation: 0.0 },
      { date: days[2], tempMax: 32, tempMin: 25, condition: "Slight Rain", precipitation: 8.5 },
      { date: days[3], tempMax: 30, tempMin: 24, condition: "Thunderstorm", precipitation: 18.0 },
      { date: days[4], tempMax: 31, tempMin: 24, condition: "Overcast", precipitation: 4.2 },
      { date: days[5], tempMax: 33, tempMin: 26, condition: "Partly Cloudy", precipitation: 1.0 },
      { date: days[6], tempMax: 34, tempMin: 27, condition: "Mainly Clear", precipitation: 0.0 }
    ]
  };
}
