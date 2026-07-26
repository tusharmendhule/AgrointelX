import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  HelpCircle, 
  Beaker, 
  ShieldCheck, 
  ChevronRight, 
  Settings, 
  Sprout, 
  Sparkles,
  Award
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { YieldPredictionResult } from "../types";
import { useAuth } from "../context/AuthContext";

export default function YieldPrediction() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [crop, setCrop] = useState("Rice");
  const [area, setArea] = useState(user?.farmSize ? user.farmSize.toString() : "12.5");
  const [soilType, setSoilType] = useState(user?.soilType || "Alluvial");
  const [fertilizerUsed, setFertilizerUsed] = useState("Organic NPK and slow-release Urea");
  const [irrigationType, setIrrigationType] = useState("Drip Irrigation");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YieldPredictionResult | null>(null);
  const [error, setError] = useState("");

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await api.predictYield({
        crop,
        area: parseFloat(area),
        soilType,
        fertilizerUsed,
        irrigationType,
        expectedRainfall: 450 // standard region season rainfall
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || t("yield.genericError", "Yield predictive matrix failed. Verify land values."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-emerald-500 animate-pulse" />
          {t("yield.pageTitle", "Harvest Yield Forecasting & Optimization")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("yield.pageSubtitle", "Predict total crop tonnage using precision acreage variables, organic resource logging, and weather trends.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("yield.farmInputMatrix", "Farm Input Matrix")}</h3>
              <p className="text-[10px] text-slate-400">{t("yield.farmInputMatrixDesc", "Specify crop cycles & resources used")}</p>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("yield.targetCrop", "Target Crop")}</label>
                <select 
                  value={crop} 
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Rice">{t("crops.rice", "Paddy Rice")}</option>
                  <option value="Wheat">{t("crops.wheat", "Spring Wheat")}</option>
                  <option value="Cotton">{t("crops.cotton", "Fibre Cotton")}</option>
                  <option value="Maize">{t("crops.maize", "Yellow Maize")}</option>
                  <option value="Sugarcane">{t("crops.sugarcane", "Sugarcane")}</option>
                  <option value="Potato">{t("crops.potato", "Potato tubers")}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("yield.areaCultivated", "Area Cultivated (Acres)")}</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={area} 
                  onChange={(e) => setArea(e.target.value)}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("yield.soilType", "Soil Type")}</label>
                <select 
                  value={soilType} 
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Alluvial">{t("soil.alluvialShort", "Alluvial Loam")}</option>
                  <option value="Black">{t("soil.blackShort", "Black Regur")}</option>
                  <option value="Red">{t("soil.redShort", "Red Acidic")}</option>
                  <option value="Sandy">{t("soil.sandyShort", "Sandy Loam")}</option>
                  <option value="Clay">{t("soil.clayShort", "Clay Rich")}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("yield.irrigationChannel", "Irrigation Channel")}</label>
                <select 
                  value={irrigationType} 
                  onChange={(e) => setIrrigationType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Drip Irrigation">{t("irrigation.drip", "Drip Irrigation (Optimal)")}</option>
                  <option value="Sprinklers">{t("irrigation.sprinklers", "Micro Sprinklers")}</option>
                  <option value="Rainfed">{t("irrigation.rainfed", "Rainfed (Conventional)")}</option>
                  <option value="Furrow Flood">{t("irrigation.furrow", "Furrow Flooding")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("yield.fertilizerDesc", "Fertilizer Additions Description")}</label>
              <input 
                type="text" 
                value={fertilizerUsed} 
                onChange={(e) => setFertilizerUsed(e.target.value)}
                placeholder={t("yield.fertilizerPlaceholder", "e.g. 50kg Neem-coated Urea, 25kg Potash")}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 transition-colors"
            >
              {loading ? t("yield.simulating", "Simulating Harvest Metrics...") : t("yield.predictCta", "Predict Projected Tonnage")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Forecast output */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[350px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-900/10"
              >
                <TrendingUp className="h-10 w-10 text-emerald-500/30 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-300">{t("yield.reportTitle", "Harvest Predictor Report")}</h4>
                <p className="text-xs max-w-sm mt-1">{t("yield.reportDesc", "Specify target crop and resource inputs on the left. AgroIntelX will calculate yield metric outputs.")}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-6"
              >
                {/* Result header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-md border border-emerald-500/20">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">{t("yield.totalProjection", "Total Yield Projection")}</span>
                      <h3 className="text-2xl font-black tracking-tight">{result.predictedYieldTonnes} {t("yield.metricTonnes", "Metric Tonnes")}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("yield.estimatedOn", "Estimated on {{area}} cultivated acres", { area })}</p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">{t("yield.perAcre", "Yield Per Acre")}</span>
                    <span className="text-xl font-black font-mono text-emerald-400">{result.predictedYieldPerAcre} {t("yield.tonnesPerAcre", "Tonnes/Ac")}</span>
                  </div>
                </div>

                {/* Limiting factors */}
                <div className="text-xs">
                  <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 shrink-0" /> {t("yield.limitingRisks", "Limiting Yield Risks")}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {result.limitingFactors.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* Resource optimizations */}
                <div className="text-xs pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5" /> {t("yield.soilEnhancements", "AI Recommended Soil Enhancements")}
                  </h4>
                  <div className="space-y-2.5">
                    {result.optimizationRecommendations.map((opt, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                        <p className="text-slate-300 font-semibold text-[11px] leading-relaxed">{opt}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
