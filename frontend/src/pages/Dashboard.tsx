import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Plus, 
  CircleCheck, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Bot,
  HeartPulse,
  Trash2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { WeatherData, Expense, FarmCalendarTask } from "../types";

export default function Dashboard() {
  const { t: translate } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<FarmCalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for quick-task/expense additions
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCrop, setTaskCrop] = useState("Rice");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState<any>("sowing");
  const [taskPriority, setTaskPriority] = useState<any>("medium");
  const [showQuickTask, setShowQuickTask] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [w, exp, tsk] = await Promise.all([
          api.getWeather(),
          api.getExpenses(),
          api.getTasks()
        ]);
        setWeather(w);
        setExpenses(exp);
        setTasks(tsk);
      } catch (err) {
        console.error("Dashboard failed loading:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      const updated = await api.toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDate) return;
    try {
      const added = await api.addTask({
        title: taskTitle,
        date: taskDate,
        crop: taskCrop,
        priority: taskPriority,
        category: taskCategory
      });
      setTasks(prev => [...prev, added]);
      setTaskTitle("");
      setTaskDate("");
      setShowQuickTask(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Compile Chart data
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(categoryTotals).map(cat => ({
    name: cat.toUpperCase(),
    value: categoryTotals[cat]
  }));

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

  const barData = tasks.slice(0, 6).map(t => ({
    name: t.title.substring(0, 12) + "...",
    priority: t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1
  }));

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse md:col-span-2" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {translate("dashboard.hello", "Hello")}, {user?.name || translate("dashboard.farmer", "Farmer")} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {translate("dashboard.subtitle", "Review your dynamic microclimates, complete agricultural tasks, and plan resources.")}
          </p>
        </div>

        {/* FAST ACTION MENU */}
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            to="/ai-assistant" 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-emerald-600/10"
          >
            <Bot className="h-4 w-4 animate-pulse" />
            {translate("nav.aiAdvisor", "AI Advisor")}
          </Link>
          <Link 
            to="/crop-recommendation" 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
          >
            <Sprout className="h-4 w-4 text-emerald-500" />
            {translate("dashboard.soilRec", "Soil Rec")}
          </Link>
          <Link 
            to="/disease-detection" 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            {translate("dashboard.foliageCheck", "Foliage Check")}
          </Link>
          <button 
            onClick={() => setShowQuickTask(true)} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
          >
            <Plus className="h-4 w-4 text-emerald-500" />
            {translate("dashboard.task", "Task")}
          </button>
        </div>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Farm Size */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">{translate("dashboard.totalCultivations", "Total Cultivations")}</span>
            <h3 className="text-2xl font-black mt-1">{user?.farmSize || 12.5} {translate("common.acres", "Acres")}</h3>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">{translate("dashboard.classification", "Classification")}: {user?.soilType || "Alluvial"}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Sprout className="h-6 w-6" />
          </div>
        </div>

        {/* Expenses */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">{translate("dashboard.currentLedger", "Current Ledger")}</span>
            <h3 className="text-2xl font-black mt-1">₹{totalExpenseSum.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{expenses.length} {translate("dashboard.distinctItems", "distinct seed & fuel items")}</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Active Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">{translate("dashboard.sowingTasks", "Sowing Tasks")}</span>
            <h3 className="text-2xl font-black mt-1">
              {tasks.filter(t => !t.completed).length} / {tasks.length}
            </h3>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">
              {tasks.filter(t => t.completed).length} {translate("dashboard.itemsCompleted", "items completed")}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Live Weather Indicator */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">{translate("dashboard.soilMoisture", "Soil Moisture")}</span>
            <h3 className="text-2xl font-black mt-1">{weather?.soilMoisture || 40}% RH</h3>
            <p className="text-[10px] text-teal-400 font-medium mt-1">{translate("dashboard.soilTemp", "Soil Temp")}: {weather?.soilTemp || 28}°C</p>
          </div>
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
            <CloudSun className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* DASHBOARD CHARTS AND CALENDAR CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left pane: tasks calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight">{translate("dashboard.activeOperations", "Active Farming Operations")}</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">{translate("dashboard.today", "Today")}</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">{translate("dashboard.noTasks", "No farm tasks listed. Sowing a crop generates tasks automatically!")}</p>
              ) : (
                tasks.map((t) => (
                  <div 
                    key={t.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      t.completed 
                        ? "bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60" 
                        : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={() => handleToggleTask(t.id)}
                        className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                          t.completed 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {t.completed && <CircleCheck className="h-4 w-4" />}
                      </button>
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${t.completed ? "line-through text-slate-500" : ""}`}>{t.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">{t.crop}</span>
                          <span className={`text-[9px] uppercase font-bold ${t.priority === "high" ? "text-rose-500" : t.priority === "medium" ? "text-amber-500" : "text-slate-400"}`}>
                            {translate(`priority.${t.priority}`, t.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        {t.date}
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>{translate("dashboard.healthTip", "Keep your soil healthy. Complete pending boosters before rainfall!")}</span>
            <Link to="/calendar" className="text-emerald-500 hover:underline flex items-center gap-0.5 font-bold">
              {translate("dashboard.fullCalendar", "Full Calendar")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right pane: Expense pie-chart */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight mb-2">{translate("dashboard.expenseAllocation", "Expense Allocation")}</h2>
            <p className="text-xs text-slate-400">{translate("dashboard.expenseAllocationDesc", "Financial distribution across farming inputs.")}</p>
          </div>

          <div className="h-44 my-4 flex items-center justify-center relative">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">{translate("dashboard.noExpenseItems", "No seed/fuel items logged yet.")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value ?? 0).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">{translate("dashboard.totalLogged", "Total Logged")}</span>
              <span className="text-sm font-bold">₹{totalExpenseSum.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs pr-1">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{item.name.toLowerCase()}</span>
                </div>
                <span className="font-mono text-[11px] font-bold">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* QUICK TASK DIALOG OVERLAY */}
      {showQuickTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 relative"
          >
            <h3 className="text-base font-bold mb-4">{translate("dashboard.addFarmTask", "Add Farm Task")}</h3>
            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{translate("dashboard.taskTitle", "Task Title")}</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={translate("dashboard.taskTitlePlaceholder", "e.g. Sowing Maize / Apply Urea")}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{translate("dashboard.cropType", "Crop Type")}</label>
                  <input 
                    type="text" 
                    value={taskCrop}
                    onChange={(e) => setTaskCrop(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{translate("dashboard.dueDate", "Due Date")}</label>
                  <input 
                    type="date" 
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{translate("dashboard.category", "Category")}</label>
                  <select 
                    value={taskCategory} 
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                  >
                    <option value="sowing">{translate("taskCategory.sowing", "Sowing")}</option>
                    <option value="irrigation">{translate("taskCategory.irrigation", "Irrigation")}</option>
                    <option value="fertilizing">{translate("taskCategory.fertilizing", "Fertilizing")}</option>
                    <option value="spraying">{translate("taskCategory.spraying", "Spraying")}</option>
                    <option value="harvesting">{translate("taskCategory.harvesting", "Harvesting")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{translate("dashboard.priority", "Priority")}</label>
                  <select 
                    value={taskPriority} 
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                  >
                    <option value="low">{translate("priority.low", "Low")}</option>
                    <option value="medium">{translate("priority.medium", "Medium")}</option>
                    <option value="high">{translate("priority.high", "High")}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowQuickTask(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 font-semibold"
                >
                  {translate("common.cancel", "Cancel")}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold"
                >
                  {translate("dashboard.saveTask", "Save Task")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
