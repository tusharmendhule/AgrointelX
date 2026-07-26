import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  HeartPulse, 
  Plus, 
  Trash2, 
  ChevronRight, 
  CircleAlert,
  TrendingDown,
  Clock,
  ArrowUpRight,
  Filter,
  CircleCheck,
  Award
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Livestock } from "../types";

export default function LivestockPage() {
  const { t } = useTranslation();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [breed, setBreed] = useState("");
  const [count, setCount] = useState("");
  const [purpose, setPurpose] = useState<any>("dairy");
  const [healthStatus, setHealthStatus] = useState<any>("healthy");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadLivestock() {
      try {
        const list = await api.getLivestock();
        setLivestock(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLivestock();
  }, []);

  const handleAddLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!breed || !count || parseInt(count) <= 0) {
      setFormError(t("livestock.invalidMetrics", "All livestock metrics must be positive numbers."));
      return;
    }

    try {
      const added = await api.addLivestock({
        breed,
        count: parseInt(count),
        purpose,
        healthStatus
      });
      setLivestock(prev => [...prev, added]);
      setBreed("");
      setCount("");
    } catch (err: any) {
      setFormError(err.message || t("livestock.logFailed", "Failed to log livestock herd."));
    }
  };

  const handleDeleteLivestock = async (id: string) => {
    try {
      await api.deleteLivestock(id);
      setLivestock(prev => prev.filter(li => li.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse col-span-2" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-emerald-500" />
          {t("livestock.pageTitle", "Herd Registers & Livestock Health Desks")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("livestock.pageSubtitle", "Monitor your dairy cattle breeds, feed ratios, vaccine timers, and veterinary diagnostics.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Livestock list */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="font-bold text-sm">{t("livestock.activeHerds", "Active Animal Herds")}</h3>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold">
              {t("livestock.totalHead", "{{count}} Total Head", { count: livestock.reduce((sum, l) => sum + (l.count ?? 0), 0) })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {livestock.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 col-span-2">{t("livestock.noHerds", "No active herds logged. Log cattle or poultry on the right pane.")}</p>
            ) : (
              livestock.map((li) => (
                <div 
                  key={li.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 flex flex-col justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        li.healthStatus === "healthy" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : li.healthStatus === "quarantined" 
                          ? "bg-rose-500/10 text-rose-400" 
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {t(`healthStatus.${li.healthStatus}`, li.healthStatus)}
                      </span>
                      <button 
                        onClick={() => handleDeleteLivestock(li.id)}
                        className="text-slate-500 hover:text-rose-500 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{li.breed}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{t("livestock.animalsCount", "({{count}} animals)", { count: li.count })}</span>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-400">
                      <p>{t("livestock.activityIntent", "Activity Intent")}: <span className="text-slate-300 font-semibold capitalize">{t(`livestockPurpose.${li.purpose}`, li.purpose || "")}</span></p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" /> {t("livestock.vaccineSchedule", "Vaccine schedule")}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{t("livestock.allCompleted", "All Completed")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Herd */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("livestock.registerHerd", "Register Livestock Herd")}</h3>
              <p className="text-[10px] text-slate-400">{t("livestock.registerHerdDesc", "Add animal cohorts to registers")}</p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddLivestock} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("livestock.breedName", "Breed / Cohort Name")}</label>
              <input 
                type="text" 
                value={breed} 
                onChange={(e) => setBreed(e.target.value)}
                placeholder={t("livestock.breedPlaceholder", "e.g. Sahiwal Cattle / Murrah Buffalo")} 
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("livestock.headCount", "Head Count")}</label>
                <input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="e.g. 15" 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("livestock.primaryPurpose", "Primary Purpose")}</label>
                <select 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="dairy">{t("livestockPurposeFull.dairy", "Dairy Production (Milk)")}</option>
                  <option value="draft">{t("livestockPurposeFull.draft", "Draft animal / Ploughing")}</option>
                  <option value="poultry">{t("livestockPurposeFull.poultry", "Poultry / Layer eggs")}</option>
                  <option value="wool">{t("livestockPurposeFull.wool", "Wool shearing")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("livestock.vetHealthStatus", "Veterinary Health Status")}</label>
              <select 
                value={healthStatus} 
                onChange={(e) => setHealthStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="healthy">{t("healthStatusFull.healthy", "Healthy (Checked)")}</option>
                <option value="quarantined">{t("healthStatusFull.quarantined", "Under Quarantine (Observation)")}</option>
                <option value="treatment">{t("healthStatusFull.treatment", "Receiving active treatment")}</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-md transition-colors"
            >
              {t("livestock.logCohortCta", "Log Cohort Record")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
