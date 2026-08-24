import { Link } from "react-router-dom";
import { useWeather } from "../context/WeatherContext";
import { Calendar } from "lucide-react";

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

const getDayLabel = (dateStr: string, index: number): { day: string; date: string } => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return { day: "Today", date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  if (date.toDateString() === tomorrow.toDateString()) return { day: "Tomorrow", date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
};

export default function WeatherForecast() {
  const { weather, isLoading } = useWeather();
  const forecast = weather?.forecast ?? [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">7-Day Forecast</h2>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No forecast data available</p>
      </div>
    );
  }

  const days = forecast.slice(0, 7);

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">7-Day Forecast</h2>
        </div>
        <Link
          to="/weather"
          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          View full forecast →
        </Link>
      </div>

      {/* Forecast Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const { day: dayLabel, date } = getDayLabel(day.date, index);
          const isToday = index === 0;

          return (
            <div
              key={day.date}
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                isToday
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-sm"
                  : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              {/* Day Name */}
              <span className={`text-[10px] font-bold ${isToday ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>
                {dayLabel}
              </span>

              {/* Date */}
              <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">{date}</span>

              {/* Emoji */}
              <span className="text-2xl my-2">{getWeatherEmoji(day.condition)}</span>

              {/* High Temp */}
              <span className="text-sm font-black text-slate-900 dark:text-white">{day.tempMax}°</span>

              {/* Low Temp */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{day.tempMin}°</span>

              {/* Rain Probability */}
              {day.precipitation !== undefined && day.precipitation !== null && (
                <div className="flex items-center gap-0.5 mt-1.5">
                  <span className="text-[8px] text-blue-400">💧</span>
                  <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400">{day.precipitation}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
