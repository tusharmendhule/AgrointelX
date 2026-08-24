import { useWeather } from "../context/WeatherContext";
import { useLocation } from "../context/LocationContext";
import { RefreshCw, MapPin, Sun, Sunrise, Sunset, Droplets, Wind, CloudRain, Gauge, Eye, Thermometer } from "lucide-react";

const getWeatherEmoji = (condition?: string): string => {
  if (!condition) return "🌤️";
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("heavy rain") || c.includes("downpour")) return "🌧️";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "🌦️";
  if (c.includes("overcast")) return "☁️";
  if (c.includes("cloud") || c.includes("partly")) return "⛅";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "🌫️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  return "🌤️";
};

function formatTime(timeStr?: string): string {
  if (!timeStr) return "--:--";
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return timeStr;
  }
}

export default function CurrentWeatherCard() {
  const { weather, isLoading, lastUpdated, refreshWeather } = useWeather();
  const location = useLocation();

  const temp = weather?.temp ?? null;
  const feelsLike = weather?.feelsLike ?? null;
  const condition = weather?.condition ?? "Clear";
  const humidity = weather?.humidity ?? null;
  const windSpeed = weather?.windSpeed ?? null;
  const windDirection = weather?.windDirection ?? null;
  const rain = weather?.precipitation ?? null;
  const uvIndex = weather?.uvIndex ?? null;
  const pressure = weather?.pressure ?? null;
  const visibility = weather?.visibility ?? null;
  const sunrise = weather?.sunrise;
  const sunset = weather?.sunset;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-16 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Local Weather
        </h2>
        <button
          onClick={refreshWeather}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors"
          title="Refresh weather"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Temperature & Condition */}
      <div className="flex items-start gap-4 mb-5">
        <div className="text-5xl leading-none">{getWeatherEmoji(condition)}</div>
        <div>
          <div className="flex items-start gap-1">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{temp ?? "--"}</span>
            <span className="text-xl font-bold text-slate-400 dark:text-slate-500 mt-1">°C</span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{condition}</p>
          {feelsLike !== null && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              Feels like {feelsLike}°C
            </p>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-5">
        {humidity !== null && (
          <div className="flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Humidity</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">{humidity}%</span>
          </div>
        )}
        {windSpeed !== null && (
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Wind</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">
              {windSpeed} km/h{windDirection ? ` ${windDirection}` : ""}
            </span>
          </div>
        )}
        {rain !== null && (
          <div className="flex items-center gap-2">
            <CloudRain className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Rain</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">{rain} mm</span>
          </div>
        )}
        {uvIndex !== null && (
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">UV Index</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">
              {uvIndex} {uvIndex <= 2 ? "(Low)" : uvIndex <= 5 ? "(Moderate)" : uvIndex <= 7 ? "(High)" : "(Very High)"}
            </span>
          </div>
        )}
        {pressure !== null && (
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Pressure</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">{pressure} hPa</span>
          </div>
        )}
        {visibility !== null && (
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Visibility</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-auto">{visibility} km</span>
          </div>
        )}
      </div>

      {/* Sunrise / Sunset */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <Sunrise className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(sunrise)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sunset className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(sunset)}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="h-3 w-3 text-emerald-500" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
          {location.locationName || "Location not set"}
        </span>
      </div>

      {/* Updated */}
      {lastUpdated && (
        <p className="text-[9px] text-slate-400 dark:text-slate-500">
          Updated just now
        </p>
      )}
    </div>
  );
}
