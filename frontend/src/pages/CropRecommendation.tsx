import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Leaf, 
  Settings, 
  Beaker, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Award,
  ChevronRight,
  CircleAlert,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { CropRecommendationResult, WeatherData } from "../types";
import { useAuth } from "../context/AuthContext";

export default function CropRecommendation() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [nitrogen, setNitrogen] = useState("50");
  const [phosphorus, setPhosphorus] = useState("45");
  const [potassium, setPotassium] = useState("40");
  const [ph, setPh] = useState("6.2");
  const [soilType, setSoilType] = useState(user?.soilType || "Alluvial");

  const [weatherBrief, setWeatherBrief] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropRecommendationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWeather() {
      try {
        const w = await api.getWeather();
        setWeatherBrief(w);
      } catch (err) {
        console.error(err);
      }
    }
    loadWeather();
  }, []);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await api.recommendCrop({
        nitrogen: parseFloat(nitrogen),
        phosphorus: parseFloat(phosphorus),
        potassium: parseFloat(potassium),
        ph: parseFloat(ph),
        soilType,
        temperature: weatherBrief?.temp || 30,
        humidity: weatherBrief?.humidity || 65,
        rainfall: (weatherBrief?.precipitation || 0) * 30 + 100
      });
      setResult(res);

      // Trigger automatic welcome notification inside the sandbox
      await api.addTask({
        title: `Prepare Sowing Bed: ${res.crop}`,
        date: new Date(Date.now() + 3600000 * 24 * 3).toISOString().split("T")[0],
        crop: res.crop,
        priority: "high",
        category: "sowing"
      });

    } catch (err: any) {
      setError(err.message || t("crop.genericError", "Recommendation algorithm encountered a matrix mismatch."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Leaf className="h-8 w-8 text-emerald-500 animate-bounce" />
          {t("crop.pageTitle", "AI-Powered Precision Crop Recommendation")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("crop.pageSubtitle", "Generate maximum yielding, land-compatible crop suggestions based on macronutrients (NPK), Soil pH, and microclimates.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Soil Form panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("crop.macronutrientMetrics", "Macronutrient Input Metrics")}</h3>
              <p className="text-[10px] text-slate-400">{t("crop.macronutrientMetricsDesc", "Readings from Soil Health Cards (PPM / pH)")}</p>
            </div>
          </div>

          <form onSubmit={handleRecommend} className="space-y-4 text-xs">
            
            {/* NPK parameters */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("crop.nitrogen", "Nitrogen (N)")}</label>
                <input 
                  type="number" 
                  value={nitrogen} 
                  onChange={(e) => setNitrogen(e.target.value)}
                  min="0" max="200" required
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("crop.phosphorus", "Phosphorus (P)")}</label>
                <input 
                  type="number" 
                  value={phosphorus} 
                  onChange={(e) => setPhosphorus(e.target.value)}
                  min="0" max="200" required
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("crop.potassium", "Potassium (K)")}</label>
                <input 
                  type="number" 
                  value={potassium} 
                  onChange={(e) => setPotassium(e.target.value)}
                  min="0" max="200" required
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* pH and Soil type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("crop.soilPh", "Soil pH Factor")}</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={ph} 
                  onChange={(e) => setPh(e.target.value)}
                  min="3.0" max="10.0" required
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("crop.soilTaxonomy", "Soil Taxonomy")}</label>
                <select 
                  value={soilType} 
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Alluvial">{t("soil.alluvialShort", "Alluvial Loam")}</option>
                  <option value="Black">{t("soil.blackShort", "Black Regur")}</option>
                  <option value="Red">{t("soil.redShort", "Red Acidic")}</option>
                  <option value="Sandy">{t("soil.sandyShort", "Sandy Loam")}</option>
                  <option value="Clay">{t("soil.clayShort", "Clay Rich")}</option>
                </select>
              </div>
            </div>

            {/* Weather Injection display */}
            {weatherBrief && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5 text-emerald-500 animate-spin-slow" /> {t("crop.autoBlending", "Microclimate auto-blending active")}
                </span>
                <span className="font-mono text-emerald-500">{weatherBrief.temp}°C, {weatherBrief.humidity}% RH</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 transition-colors"
            >
              {loading ? t("crop.runningEngine", "Running Crop ML Engine...") : t("crop.analyzeCta", "Analyze Soil compatibility")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Suggestion Result Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[350px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900/10"
              >
                <Beaker className="h-10 w-10 text-emerald-500/30 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-400 dark:text-slate-300">{t("crop.reportPendingTitle", "Soil Diagnostic Report Pending")}</h4>
                <p className="text-xs max-w-sm mt-1">{t("crop.reportPendingDesc", "Input NPK nutrients and pH measurements on the left panel. Our cognitive agronomist will recommend optimal crops in real-time.")}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md space-y-6 shadow-sm"
              >
                {/* Crop Recommendation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-md border border-emerald-500/20">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">{t("crop.modelRecommendation", "Model Recommendation")}</span>
                      <h3 className="text-2xl font-black tracking-tight">{result.crop}</h3>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">{t("crop.confidenceScore", "Confidence Score")}</span>
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Analytical Bento Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t("crop.cycleDuration", "Cycle Duration")}</span>
                    <p className="font-bold text-base mt-1 text-slate-900 dark:text-slate-100 font-mono">{result.growthDurationDays} {t("common.days", "Days")}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{t("crop.sowingToHarvest", "From sowing to harvest")}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">{t("crop.marketProjections", "Market Projections")}</span>
                    <p className={`font-bold text-base mt-1 font-mono ${result.marketDemand === "High" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{t(`marketDemand.${result.marketDemand}`, result.marketDemand)}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{t("crop.regionalDemand", "SaaS regional demand")}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">{t("crop.alternatesSuggested", "Alternates Suggested")}</span>
                    <p className="font-bold text-xs mt-1.5 text-slate-900 dark:text-slate-100 truncate">{result.alternativeCrops.join(", ")}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{t("crop.fallbackCrops", "Secondary fallback crops")}</span>
                  </div>
                </div>

                {/* Explainable AI block */}
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t("crop.suitabilityDiagnosis", "Suitability Diagnosis (Explainable AI)")}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{result.suitabilityReason}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t("crop.fertilizerTips", "Fertilizer Adjustment Tips")}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{result.fertilizerTips}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t("crop.irrigationScheduling", "Water & Irrigation Scheduling")}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{result.irrigationNeeds}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-[10px] text-emerald-500/80 text-center font-semibold">
                  🌿 {t("crop.taskAddedNote", "Note: A preparatory task has been automatically appended to your Farming Calendar!")}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
