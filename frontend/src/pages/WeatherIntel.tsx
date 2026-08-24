import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  Sparkles,
  Navigation,
  CircleArrowDown
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { WeatherData } from "../types";
import { useAuth } from "../context/AuthContext";
import { useWeather } from "../context/WeatherContext";
import { useLocation } from "../context/LocationContext";
import CurrentWeatherCard from "../components/CurrentWeatherCard";
import WeatherForecast from "../components/WeatherForecast";
import WeatherRiskCard from "../components/WeatherRiskCard";
import FarmWeatherActions from "../components/FarmWeatherActions";

export default function WeatherIntel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { weather, isLoading: weatherLoading, refreshWeather, timeSinceUpdate } = useWeather();
  const { locationName } = useLocation();
  const [loading, setLoading] = useState(false);

  if (weatherLoading && !weather) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse col-span-2" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
        <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Weather Intelligence</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Set your farm location to see weather data.</p>
      </div>
    );
  }

  // Generate scientific action advice based on atmospheric parameters
  const getAgriAdvice = () => {
    const advices = [];
    if (weather.soilMoisture < 30) {
      advices.push({
        title: t("weather.advice.irrigation.title", "Irrigation Protocol Activated"),
        desc: t("weather.advice.irrigation.desc", "Soil moisture has collapsed below critical 30% threshold. Activate drip irrigation immediately for maximum root absorption."),
        severity: "warning"
      });
    } else {
      advices.push({
        title: t("weather.advice.stable.title", "Moisture Balance Stable"),
        desc: t("weather.advice.stable.desc", "Current soil hydration indices are balanced. Maintain default water scheduling."),
        severity: "success"
      });
    }

    const rainDays = weather.forecast.filter(f => f.precipitation > 5.0);
    if (rainDays.length > 0) {
      advices.push({
        title: t("weather.advice.delayFertilizer.title", "Delay Fertilizer Application"),
        desc: t("weather.advice.delayFertilizer.desc", "Heavy downpours (up to {{mm}}mm) are expected on {{date}}. Reschedule any surface nitrogen or biopesticides dusting to prevent run-off.", { mm: Math.max(...weather.forecast.map(f => f.precipitation)), date: rainDays[0].date }),
        severity: "alert"
      });
    }

    if (weather.temp > 35) {
      advices.push({
        title: t("weather.advice.thermal.title", "Thermal Stress Counter-measures"),
        desc: t("weather.advice.thermal.desc", "Ambient temperature exceeds 35°C. Apply light organic mulch across crops roots to decrease evaporation loss and cool down microclimates."),
        severity: "warning"
      });
    }

    return advices;
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <CloudSun className="h-8 w-8 text-emerald-500 animate-pulse" />
          {t("weather.pageTitle", "Weather Intelligence & Microclimate Maps")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("weather.pageSubtitle", "Dynamic atmospheric parameters synchronized with national meteorological radars for {{location}}.", { location: user?.farmLocation || t("weather.defaultRegion", "Punjab region") })}
        </p>
      </div>

      {/* METEOROLOGICAL CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core parameters */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">{t("weather.atmosphericCore", "Atmospheric Core")}</span>
              <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-500">
                <Navigation className="h-3.5 w-3.5" /> {t("weather.gpsLive", "GPS Coordinates Live")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <div className="text-center sm:text-left">
                <span className="text-5xl sm:text-6xl font-black tracking-tight">{weather.temp}°C</span>
                <p className="text-sm text-slate-400 font-semibold mt-2">{weather.condition}</p>
              </div>

              <div className="h-px sm:h-12 w-full sm:w-px bg-slate-200 dark:bg-slate-800" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <Droplets className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-slate-400 font-medium">{t("weather.airHumidity", "Air Humidity")}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{weather.humidity}% RH</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Wind className="h-5 w-5 text-teal-400" />
                  <div>
                    <p className="text-slate-400 font-medium">{t("weather.windVelocity", "Wind velocity")}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{weather.windSpeed} km/h</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Thermometer className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-slate-400 font-medium">{t("weather.soilTemperature", "Soil Temperature")}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{weather.soilTemp}°C</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <CircleArrowDown className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-slate-400 font-medium">{t("weather.precipitation", "Precipitation")}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{weather.precipitation} mm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3">
            {t("weather.windTrendNote", "Wind trends blowing from South-Southwest. Heavy evapotranspiration values observed.")}
          </div>
        </div>

        {/* Soil Moisture Radar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-6">{t("weather.soilMoistureIndices", "Soil Moisture Indices")}</h3>
            
            <div className="flex flex-col items-center py-4">
              <span className="text-4xl font-black font-mono text-emerald-400">{weather.soilMoisture}%</span>
              <span className="text-xs text-slate-400 mt-1 font-semibold">{t("weather.awc", "Available Water Content (AWC)")}</span>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" 
                  style={{ width: `${weather.soilMoisture}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            {t("weather.thresholdNote", "Critical Threshold is 30%. Saturated state occurs above 80%.")}
          </p>
        </div>

      </div>

      {/* ENHANCED WEATHER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeatherRiskCard />
        <div className="lg:col-span-2">
          <FarmWeatherActions />
        </div>
      </div>

      {/* 7-DAY FORECAST */}
      <WeatherForecast />

      {/* AI DECISIONS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" /> {t("weather.aiDecision", "AI Microclimate Decision")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getAgriAdvice().map((adv, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border text-xs ${
                adv.severity === "alert" 
                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300" 
                  : adv.severity === "warning" 
                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300" 
                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-bold text-sm">{adv.title}</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400 text-[11px]">{adv.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
