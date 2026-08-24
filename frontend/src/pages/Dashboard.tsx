import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Sprout, CloudSun, TrendingUp, Wallet, Calendar, Plus, CircleCheck, Clock,
  AlertTriangle, ChevronRight, Sparkles, Bot, Trash2, ExternalLink
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useWeather } from "../context/WeatherContext";
import { api } from "../lib/api";
import { Expense, FarmCalendarTask } from "../types";
import CurrentWeatherCard from "../components/CurrentWeatherCard";
import WeatherForecast from "../components/WeatherForecast";
import WeatherRiskCard from "../components/WeatherRiskCard";
import FarmWeatherActions from "../components/FarmWeatherActions";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { weather } = useWeather();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<FarmCalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [showQuickTask, setShowQuickTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCrop, setTaskCrop] = useState("Rice");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState<any>("sowing");
  const [taskPriority, setTaskPriority] = useState<any>("medium");

  useEffect(() => {
    async function load() {
      try {
        const [exp, tsk] = await Promise.all([api.getExpenses(), api.getTasks()]);
        setExpenses(exp);
        setTasks(tsk);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      await api.toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDate) return;
    try {
      const added = await api.addTask({ title: taskTitle, date: taskDate, crop: taskCrop, priority: taskPriority, category: taskCategory });
      setTasks(prev => [...prev, added]);
      setTaskTitle(""); setTaskDate(""); setShowQuickTask(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (id: string) => {
    try { await api.deleteTask(id); setTasks(prev => prev.filter(t => t.id !== id)); } catch (err) { console.error(err); }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── QUICK ACTION BAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/ai-assistant" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-semibold text-white shadow-md shadow-emerald-600/10 transition-all">
          <Bot className="h-4 w-4" /> {t("nav.aiAdvisor", "AI Advisor")}
        </Link>
        <Link to="/crop-recommendation" className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-sm">
          <Sprout className="h-4 w-4 text-emerald-500" /> {t("dashboard.soilRec", "Soil Rec")}
        </Link>
        <Link to="/disease-detection" className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-sm">
          <Sparkles className="h-4 w-4 text-emerald-500" /> {t("dashboard.foliageCheck", "Foliage Check")}
        </Link>
        <button onClick={() => setShowQuickTask(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-sm">
          <Plus className="h-4 w-4 text-emerald-500" /> {t("dashboard.task", "Task")}
        </button>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Cultivations */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">{t("dashboard.totalCultivations", "Total Cultivations")}</span>
            <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{user?.farmSize || 12} {t("common.acres", "Acres")}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{t("dashboard.classification", "Classification")}: {user?.soilType || "Alluvial"}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <Sprout className="h-6 w-6 text-emerald-500" />
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">{t("dashboard.currentLedger", "Current Ledger")}</span>
            <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">₹{totalExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{expenses.length} {t("dashboard.distinctItems", "distinct seed & fuel items")}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <Wallet className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">{t("dashboard.sowingTasks", "Sowing Tasks")}</span>
            <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{completedTasks} / {tasks.length}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{pendingTasks} {t("dashboard.itemsCompleted", "items completed")}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">{t("dashboard.soilMoisture", "Soil Moisture")}</span>
            <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{weather?.soilMoisture || 55}% RH</h3>
            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-1">{t("dashboard.soilTemp", "Soil Temp")}: {weather?.soilTemp || 28}°C</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-500/10 rounded-xl">
            <CloudSun className="h-6 w-6 text-teal-500" />
          </div>
        </div>
      </div>

      {/* ── WEATHER SECTION: Current + Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CurrentWeatherCard />
        <div className="lg:col-span-2">
          <WeatherForecast />
        </div>
      </div>

      {/* ── RISK + ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeatherRiskCard />
        <div className="lg:col-span-2">
          <FarmWeatherActions />
        </div>
      </div>

      {/* ── OPERATIONS + EXPENSES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.activeOperations", "Active Farming Operations")}</h2>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-500/20">{t("dashboard.today", "Today")}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">{t("dashboard.noTasks", "No farm tasks yet!")}</p>
            ) : (
              tasks.slice(0, 8).map((task) => (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed ? "opacity-50 border-slate-100 dark:border-slate-800/50" : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30"}`}>
                  <button onClick={() => handleToggleTask(task.id)} className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 hover:border-emerald-500"}`}>
                    {task.completed && <CircleCheck className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${task.completed ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{task.crop}</span>
                      <span className={`text-[8px] uppercase font-bold ${task.priority === "high" ? "text-rose-500" : task.priority === "medium" ? "text-amber-500" : "text-slate-400"}`}>{t(`priority.${task.priority}`, task.priority)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="h-3 w-3" />{task.date}</span>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <Link to="/calendar" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold flex items-center gap-0.5">
              {t("dashboard.viewAll", "View All Operations")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Expense Allocation */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t("dashboard.expenseAllocation", "Expense Allocation")}</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">{t("dashboard.expenseAllocationDesc", "Financial distribution across farming inputs.")}</p>

          <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">{t("dashboard.noExpenseItems", "No expenses logged yet.")}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${Number(v ?? 0).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500">{t("dashboard.totalLogged", "Total Logged")}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">₹{totalExpenses.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <Link to="/expenses" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold flex items-center gap-0.5">
              {t("dashboard.viewExpenses", "View Expense Ledger")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK TASK MODAL ── */}
      {showQuickTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">{t("dashboard.addFarmTask", "Add Farm Task")}</h3>
            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{t("dashboard.taskTitle", "Task Title")}</label>
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Sowing Maize" required className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{t("dashboard.cropType", "Crop Type")}</label>
                  <input type="text" value={taskCrop} onChange={(e) => setTaskCrop(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{t("dashboard.dueDate", "Due Date")}</label>
                  <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} required className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{t("dashboard.category", "Category")}</label>
                  <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100">
                    <option value="sowing">Sowing</option><option value="irrigation">Irrigation</option><option value="fertilizing">Fertilizing</option><option value="spraying">Spraying</option><option value="harvesting">Harvesting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{t("dashboard.priority", "Priority")}</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowQuickTask(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-semibold">{t("common.cancel", "Cancel")}</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold">{t("dashboard.saveTask", "Save Task")}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
