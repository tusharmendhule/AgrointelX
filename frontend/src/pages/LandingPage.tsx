import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { 
  Leaf, 
  Sparkles, 
  TrendingUp, 
  Wrench, 
  HeartPulse, 
  ShieldCheck, 
  ChevronRight, 
  Cpu, 
  CloudSun,
  MapPin,
  Bot,
  Wallet
} from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Cpu,
      color: "emerald",
      title: t("landing.feature.soil.title", "Soil NPK Analytics"),
      desc: t("landing.feature.soil.desc", "Input Nitrogen, Phosphorus, and Potassium chemical parts to generate instant optimal crop recommendations based on agronomic thresholds."),
      tag: t("landing.feature.soil.tag", "ML Supported"),
    },
    {
      icon: Sparkles,
      color: "teal",
      title: t("landing.feature.vision.title", "Computer Vision Diagnostics"),
      desc: t("landing.feature.vision.desc", "Take photos or upload snapshots of affected plant leaves. Our neural models analyze mildew, rot, and blight spots with detailed expert organic treatments."),
      tag: t("landing.feature.vision.tag", "Gemini Vision Ready"),
    },
    {
      icon: CloudSun,
      color: "blue",
      title: t("landing.feature.weather.title", "Weather Intelligence"),
      desc: t("landing.feature.weather.desc", "Hook up with real-time barometric pressure models. Predict downpours, calculate optimal soil moisture percentages, and get notifications on rain."),
      tag: t("landing.feature.weather.tag", "Open-Meteo Integration"),
    },
    {
      icon: TrendingUp,
      color: "amber",
      title: t("landing.feature.yield.title", "Tonnage Yield & Price Trends"),
      desc: t("landing.feature.yield.desc", "Predict crop harvest tonnes using land acre models, and monitor real-time historical market price trends."),
      tag: t("landing.feature.yield.tag", "Predictive Models"),
    },
    {
      icon: Wallet,
      color: "purple",
      title: t("landing.feature.finance.title", "Finance Expense Tracking"),
      desc: t("landing.feature.finance.desc", "Log cash spendings across seed acquisition, diesel, hired daily labor, and tractor rentals, grouped by responsive pie-charts."),
      tag: t("landing.feature.finance.tag", "SaaS Ledger"),
    },
    {
      icon: Bot,
      color: "rose",
      title: t("landing.feature.chat.title", "Voice AI Chatbot"),
      desc: t("landing.feature.chat.desc", "Speak or type naturally in Hindi, Marathi, or English. Get immediate help from the AgroIntelX AI advisor."),
      tag: t("landing.feature.chat.tag", "Speech Enabled"),
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    teal: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
    blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  };

  const tagColorClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-500",
    teal: "text-teal-600 dark:text-teal-500",
    blue: "text-blue-600 dark:text-blue-500",
    amber: "text-amber-600 dark:text-amber-500",
    purple: "text-purple-600 dark:text-purple-500",
    rose: "text-rose-600 dark:text-rose-500",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER NAVIGATION */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10 border-b border-slate-200 dark:border-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">AgroIntelX</h1>
            <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500">{t("landing.tagline", "Agri Decision Suite")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitcher />
          <Link to="/login" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white text-sm font-medium transition-colors">
            {t("landing.signIn", "Sign In")}
          </Link>
          <Link to="/register" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-md shadow-emerald-600/10 transition-all active:scale-95">
            {t("landing.getStarted", "Get Started")}
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 mb-6 font-medium"
        >
          <Sparkles className="h-4 w-4 animate-spin-slow" />
          {t("landing.badge", "Research-Worthy Agricultural ML Decision Engines")}
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight leading-none max-w-4xl mx-auto mb-6"
        >
          {t("landing.heroPrefix", "AI-Powered Decisions for")}{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 bg-clip-text text-transparent">
            {t("landing.heroHighlight", "Precision Farming")}
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {t("landing.heroSubtitle", "Maximize crop yields, detect foliage diseases in seconds, analyze microclimates, and track farm finance sheets on the leading enterprise SaaS agriculture suite.")}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link 
            to="/register" 
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/20 group transition-all"
          >
            {t("landing.deployCta", "Deploy AgroIntelX")}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-all"
          >
            {t("landing.sandboxCta", "Access Sandbox")}
          </Link>
        </motion.div>
      </section>

      {/* BENTO FEATURE MATRIX */}
      <section className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">
          {t("landing.featuresTitle", "Comprehensive Farming Module Ecosystem")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300 shadow-sm dark:shadow-none">
                <div>
                  <div className={`p-3 ${colorClasses[feature.color].bg} rounded-xl ${colorClasses[feature.color].text} w-fit mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                <span className={`${tagColorClasses[feature.color]} text-xs font-semibold mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                  {feature.tag} <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200 dark:border-slate-900 text-center relative z-10 text-xs text-slate-500">
        <p>{t("landing.footer", "© 2026 AgroIntelX. All rights reserved. Designed for sustainable precision crop analytics.")}</p>
      </footer>
    </div>
  );
}
