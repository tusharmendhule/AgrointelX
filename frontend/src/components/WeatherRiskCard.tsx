import { useWeather } from "../context/WeatherContext";
import { AlertTriangle } from "lucide-react";

const getRiskColor = (score: number) => {
  if (score <= 25) return { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", label: "LOW" };
  if (score <= 50) return { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", label: "MODERATE" };
  if (score <= 75) return { bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500", label: "HIGH" };
  return { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", label: "CRITICAL" };
};

export default function WeatherRiskCard() {
  const { risk: weatherRisk, isLoading } = useWeather();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const score = weatherRisk?.score ?? 5;
  const riskColor = getRiskColor(score);

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        Farm Weather Risk
      </h2>

      {/* Score */}
      <div className="flex items-end gap-2 mb-4">
        <span className="text-4xl font-black text-slate-900 dark:text-white">{score}</span>
        <span className="text-lg text-slate-400 dark:text-slate-500 font-medium mb-1">/100</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor.text} bg-current/10`}>
          {riskColor.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${riskColor.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Key Factors */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Key Factors
        </h3>
        <div className="space-y-1.5">
          {weatherRisk?.factors && weatherRisk.factors.length > 0 ? (
            weatherRisk.factors.map((factor: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-slate-600 dark:text-slate-400">{factor}</span>
              </div>
            ))
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Elevated humidity levels</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
