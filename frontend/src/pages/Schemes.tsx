import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Award, 
  Search, 
  Filter, 
  CircleCheck, 
  ChevronRight, 
  HelpCircle,
  TrendingUp,
  Briefcase,
  CircleAlert
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { GovScheme } from "../types";
import { useAuth } from "../context/AuthContext";

export default function Schemes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    async function loadSchemes() {
      try {
        const list = await api.getSchemes();
        setSchemes(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSchemes();
  }, []);

  const handleApply = async (id: string) => {
    try {
      const updated = await api.applyScheme(id);
      setSchemes(prev => prev.map(s => s.id === id ? { ...s, applied: true } : s));

      // Append application status to user notifications
      await api.addTask({
        title: `Scheme Applied: ${updated.name}`,
        date: new Date().toISOString().split("T")[0],
        crop: "Alluvial Subsidies",
        priority: "medium",
        category: "fertilizing"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const checkEligibility = (scheme: GovScheme) => {
    if (!user) return t("schemes.loginToVerify", "Login to verify eligibility");
    const size = typeof user.farmSize === "number" ? user.farmSize : parseFloat(user.farmSize || "0");
    
    if (scheme.id === "sch-1") {
      // PM-KISAN
      return size <= 5 
        ? t("schemes.eligibility.highlyEligibleSmallFarmer", "Highly Eligible (Small/Marginal Farmer Classification)") 
        : t("schemes.eligibility.ineligibleLandThreshold", "Ineligible (Exceeds maximum land threshold of 5 acres)");
    }
    if (scheme.id === "sch-2") {
      // SMAM (Mechanization)
      return t("schemes.eligibility.activeCultivations", "Eligible (Active Cultivations Detected)");
    }
    if (scheme.id === "sch-3") {
      // PMFBY (Insurance)
      return t("schemes.eligibility.activeCultivations", "Eligible (Active Cultivations Detected)");
    }
    if (scheme.id === "sch-4") {
      // NMSA
      return t("schemes.eligibility.requiresSoilSample", "Eligible (Requires Soil Sample Assessment)");
    }
    if (scheme.id === "sch-5") {
      // SHC
      return t("schemes.eligibility.noHealthCards", "Highly Eligible (No active soil health cards registered)");
    }
    if (scheme.id === "sch-6") {
      // PMKSY
      return t("schemes.eligibility.dripPrereqs", "Eligible (Drip/Sprinkler pre-requisites satisfied)");
    }
    if (scheme.id === "sch-7") {
      // KCC
      return t("schemes.eligibility.requiresIdentity", "Eligible (Requires identity and crop records)");
    }
    return t("schemes.eligibility.forReview", "Eligible for Review");
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "gov.in";
    }
  };

  const categoryLabelKeys: Record<string, string> = {
    "subsidies": "schemes.category.subsidies",
    "loans": "schemes.category.loans",
    "crop insurance": "schemes.category.cropInsurance",
    "tech acquisition": "schemes.category.techAcquisition",
  };

  const filteredSchemes = schemes.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || s.category.toLowerCase() === filterCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-emerald-500" />
            {t("schemes.pageTitle", "Government Subsidies & Agronomic Schemes")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("schemes.pageSubtitle", "Access, apply, and monitor microfinance grants, seed discounts, and crop insurances.")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative text-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("schemes.searchPlaceholder", "Search scheme name...")}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t("schemes.category.all", "All Categories")}</option>
            <option value="subsidies">{t("schemes.category.subsidies", "Direct Subsidies")}</option>
            <option value="crop insurance">{t("schemes.category.cropInsurance", "Crop Insurances")}</option>
            <option value="loans">{t("schemes.category.loans", "Agronomic Credit / Loans")}</option>
            <option value="tech acquisition">{t("schemes.category.techAcquisition", "Tech Acquisition")}</option>
          </select>
        </div>
      </div>

      {/* SCHEMES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredSchemes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12 col-span-3">{t("schemes.noMatches", "No matching agricultural schemes found.")}</p>
        ) : (
          filteredSchemes.map((s) => (
            <div 
              key={s.id}
              className="p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex flex-col justify-between group hover:border-emerald-500/20 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {t(categoryLabelKeys[s.category] || "schemes.category.other", s.category)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {t("schemes.grant", "Grant")}: {s.amount ?? `${s.subsidyPercentage}%`}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{s.description}</p>
                
                {/* Eligibility Checkbox */}
                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl mt-4 text-[11px]">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">{t("schemes.eligibilityScan", "Eligibility Scan")}</span>
                  <p className="text-slate-300 font-semibold">{checkEligibility(s)}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                <div className="flex flex-col text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-400">{t("schemes.officialPortal", "Official Portal")}:</span>
                  <span className="text-[9px] font-mono text-emerald-500/80 hover:underline">
                    {getDomain(s.link)}
                  </span>
                </div>
                
                {s.applied ? (
                  <button 
                    disabled 
                    className="px-4 py-2 bg-slate-800 text-emerald-500 font-bold rounded-xl text-[11px] flex items-center gap-1"
                  >
                    <CircleCheck className="h-3.5 w-3.5" /> {t("schemes.applied", "Applied")}
                  </button>
                ) : (
                  <a 
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleApply(s.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all"
                  >
                    {t("schemes.applyNow", "Apply Now")} <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
