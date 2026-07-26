import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { 
  Settings, 
  User, 
  MapPin, 
  Grid, 
  Beaker, 
  ChevronRight, 
  CircleAlert,
  CircleCheck,
  Database,
  Lock,
  Languages
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [farmLocation, setFarmLocation] = useState(user?.farmLocation || "");
  const [farmSize, setFarmSize] = useState(user?.farmSize || "");
  const [soilType, setSoilType] = useState(user?.soilType || "Alluvial");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.updateProfile({
        name,
        farmLocation,
        farmSize: farmSize === "" ? undefined : Number(farmSize),
        soilType
      });
      // Synchronize context
      updateProfile({
        ...user,
        name,
        farmLocation,
        farmSize,
        soilType
      } as any);

      setSuccess(t("settings.saveSuccess", "Farm profile settings synchronized successfully!"));
    } catch (err: any) {
      setError(err.message || t("settings.saveError", "Failed to update profile configurations."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-emerald-500 animate-spin-slow" />
          {t("settings.pageTitle", "Farm Profile Configurations & System Settings")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("settings.pageSubtitle", "Adjust the structural parameters used by our precision crop recommendations and yield forecasting models.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Settings form */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("settings.identityCard", "Agronomic Identity Card")}</h3>
              <p className="text-[10px] text-slate-400">{t("settings.identityCardDesc", "These variables influence AI decision outputs")}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
              <CircleAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2 text-xs">
              <CircleCheck className="h-4.5 w-4.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("settings.fullName", "Your Full Name")}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Kumar" 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("settings.farmLocation", "Geographical Farm Location")}</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={farmLocation} 
                    onChange={(e) => setFarmLocation(e.target.value)}
                    placeholder="Punjab, Ludhiana" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("settings.landSize", "Cultivated Land Size (Acres)")}</label>
                <div className="relative">
                  <Grid className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="number" 
                    step="0.1"
                    value={farmSize} 
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="12.5" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("settings.defaultSoilType", "Default Soil Classification Type")}</label>
              <div className="relative">
                <Beaker className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <select 
                  value={soilType} 
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Alluvial">{t("soil.alluvialShort", "Alluvial Loam")}</option>
                  <option value="Black">{t("soil.blackShort", "Black Regur")}</option>
                  <option value="Red">{t("soil.redShort", "Red Acidic")}</option>
                  <option value="Sandy">{t("soil.sandyShort", "Sandy Loam")}</option>
                  <option value="Clay">{t("soil.clayShort", "Clay Rich")}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-md transition-colors"
            >
              {loading ? t("settings.synchronizing", "Synchronizing server values...") : t("settings.savePreferences", "Save Settings & Preferences")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Database Status Info panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="font-bold flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-teal-400" /> {t("settings.dbState", "Database Integration State")}
            </h3>
            
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3 font-mono text-[10px] text-slate-400 leading-relaxed">
              <div className="flex justify-between">
                <span>{t("settings.dbEngine", "Database Engine")}:</span>
                <span className="text-emerald-400 font-bold">{t("settings.dbEngineValue", "Local JSON DB")}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("settings.activeSandbox", "Active Sandbox")}:</span>
                <span className="text-emerald-400">{t("common.yes", "Yes")}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("settings.encryptedTokens", "Encrypted Tokens")}:</span>
                <span className="text-teal-400">JWT (RSA-SHA256)</span>
              </div>
              <div className="flex justify-between">
                <span>{t("settings.persistencePath", "Persistence Path")}:</span>
                <span className="text-slate-500">data/db.json</span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("settings.storageNote", "Your profile configurations are stored securely inside the cloud container sandbox and preserved during active live demo sessions.")}
            </p>
          </div>

          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl text-[10px] flex items-center gap-2 mt-4">
            <Lock className="h-4 w-4 shrink-0" />
            <span>{t("settings.mfaNote", "Multi-factor authentication (MFA) protocols ready.")}</span>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("settings.languagePrefs", "Language Preferences")}</h3>
              <p className="text-[10px] text-slate-400">{t("settings.languagePrefsDesc", "Choose the interface language for AgroIntelX — English, Hindi, or Marathi")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

      </div>

    </div>
  );
}
