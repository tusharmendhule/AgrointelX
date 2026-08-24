import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useLocation } from "./LocationContext";
import { api } from "../lib/api";
import { WeatherData, WeatherRisk, WeatherRecommendation } from "../types";

interface WeatherContextType {
  weather: WeatherData | null;
  risk: WeatherRisk | null;
  recommendations: WeatherRecommendation[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refreshWeather: () => Promise<void>;
  timeSinceUpdate: string;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const WEATHER_CACHE_KEY = "agrointelx_weather";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function formatTimeSince(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.data;
        }
      }
    } catch {}
    return null;
  });

  const [risk, setRisk] = useState<WeatherRisk | null>(null);
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.timestamp || null;
      }
    } catch {}
    return null;
  });

  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Never");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update "time since" display every minute
  useEffect(() => {
    const update = () => setTimeSinceUpdate(formatTimeSince(lastUpdated));
    update();
    intervalRef.current = setInterval(update, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [lastUpdated]);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let weatherData: WeatherData;

      if (location.lat && location.lon) {
        // Use coordinates if available
        weatherData = await api.getWeatherByCoordinates(location.lat, location.lon);
        weatherData.location = location.locationName;
      } else if (location.locationName) {
        // Fall back to location string
        weatherData = await api.getWeather();
      } else if (user?.farmLocation) {
        // Use user's stored farm location
        weatherData = await api.getWeather();
      } else {
        // Use default
        weatherData = await api.getWeather();
      }

      setWeather(weatherData);
      setLastUpdated(Date.now());

      // Cache to localStorage
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        data: weatherData,
        timestamp: Date.now()
      }));

      // Fetch risk and recommendations
      try {
        const riskData = await api.getWeatherRisk(
          location.lat || undefined,
          location.lon || undefined,
          location.locationName || user?.farmLocation
        );
        setRisk(riskData.risk);
        setRecommendations(riskData.recommendations);
      } catch {
        console.warn("Failed to fetch weather risk data");
      }
    } catch (err: any) {
      console.error("Weather fetch failed:", err);
      setError("Weather data is temporarily unavailable. Try again later.");
      // If we have cached data, don't clear it
      if (!weather) {
        setWeather(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [location.lat, location.lon, location.locationName, user?.farmLocation, weather]);

  const refreshWeather = useCallback(async () => {
    await fetchWeather();
  }, [fetchWeather]);

  // Auto-refresh weather when location changes
  useEffect(() => {
    if (location.lat || location.locationName || user?.farmLocation) {
      // Check if cache is still valid
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          // Cache is valid, don't refetch
          return;
        }
      }
      fetchWeather();
    }
  }, [location.lat, location.lon, location.locationName, user?.farmLocation]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (location.lat || location.locationName || user?.farmLocation) {
        fetchWeather();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWeather, location.lat, location.locationName, user?.farmLocation]);

  return (
    <WeatherContext.Provider value={{
      weather,
      risk,
      recommendations,
      isLoading,
      error,
      lastUpdated,
      refreshWeather,
      timeSinceUpdate
    }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
}
