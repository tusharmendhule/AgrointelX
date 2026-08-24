import { useWeather } from "../context/WeatherContext";
import { Droplets, Sprout, Leaf, Wheat, Tractor, Bug } from "lucide-react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  irrigation: <Droplets className="h-4 w-4 text-blue-500" />,
  spraying: <Sprout className="h-4 w-4 text-emerald-500" />,
  fertilizer: <Leaf className="h-4 w-4 text-green-500" />,
  harvest: <Wheat className="h-4 w-4 text-amber-500" />,
  "field work": <Tractor className="h-4 w-4 text-teal-500" />,
  "disease alert": <Bug className="h-4 w-4 text-rose-500" />,
};

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  good: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  moderate: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  high: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  critical: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30",
};

export default function FarmWeatherActions() {
  const { recommendations, isLoading } = useWeather();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-12 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        ))}
      </div>
    );
  }

  const actions = (recommendations.length > 0 ? recommendations : [
    { category: "irrigation", title: "Irrigation", message: "Irrigation schedule can be postponed.", urgency: "positive" as const, icon: "💧" },
    { category: "spraying", title: "Spraying", message: "Weather conditions are suitable for spraying.", urgency: "positive" as const, icon: "🌿" },
    { category: "fertilizer", title: "Fertilizer", message: "Good conditions for fertilizer application.", urgency: "positive" as const, icon: "🧪" },
    { category: "harvest", title: "Harvest", message: "Good harvesting conditions expected for the next 7 days.", urgency: "positive" as const, icon: "🌾" },
    { category: "field", title: "Field Work", message: "Suitable weather for field preparation and operations.", urgency: "positive" as const, icon: "🚜" },
    { category: "disease", title: "Disease Alert", message: "High humidity and moderate temperature may increase fungal disease risk. Inspect crops.", urgency: "warning" as const, icon: "🐛" },
  ]).slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        What You Should Do Today
      </h2>

      {/* Action Items */}
      <div className="space-y-2.5">
        {actions.map((action: any, index: number) => {
          const typeKey = action.category?.toLowerCase() ?? "";
          const icon = ACTION_ICONS[typeKey] || <Sprout className="h-4 w-4 text-slate-400" />;
          const urgencyKey = action.urgency === "positive" ? "good" : action.urgency === "warning" ? "high" : "moderate";
          const severityStyle = SEVERITY_STYLES[urgencyKey] || SEVERITY_STYLES.moderate;

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50"
            >
              {/* Icon */}
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {action.title}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {action.message}
                </p>
              </div>

              {/* Severity Badge */}
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${severityStyle}`}>
                {urgencyKey}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
