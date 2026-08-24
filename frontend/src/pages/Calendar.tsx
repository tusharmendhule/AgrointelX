import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CircleCheck, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Filter,
  CircleCheckBig,
  CalendarDays
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { FarmCalendarTask } from "../types";

export default function CalendarPage() {
  const { t: translate } = useTranslation();
  const [tasks, setTasks] = useState<FarmCalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [crop, setCrop] = useState("Maize");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<any>("medium");
  const [category, setCategory] = useState<any>("sowing");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        const list = await api.getTasks();
        setTasks(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      await api.toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!title || !date) {
      setFormError(translate("calendar.fieldsMandatory", "All fields are mandatory."));
      return;
    }

    try {
      const added = await api.addTask({
        title,
        crop,
        date,
        priority,
        category
      });
      setTasks(prev => [...prev, added]);
      setTitle("");
    } catch (err: any) {
      setFormError(err.message || translate("calendar.addFailed", "Failed to add farm task."));
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
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-emerald-500" />
          {translate("calendar.pageTitle", "Farming Operations Planner & Crop Calendars")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {translate("calendar.pageSubtitle", "Stay synchronized on soil, seeding, moisture enrichment, and fertilizer spraying tasks.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Task lists */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="font-bold text-sm">{translate("calendar.activeSchedules", "Active Field Schedules")}</h3>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold">
              {translate("calendar.tasksPending", "{{count}} Tasks Pending", { count: tasks.filter(t => !t.completed).length })}
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">{translate("calendar.noOperations", "No operations scheduled yet. Add schedules on the right panel.")}</p>
            ) : (
              tasks.map((t) => (
                <div 
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    t.completed 
                      ? "bg-slate-500/5 border-slate-200 dark:border-slate-800 opacity-60" 
                      : "bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-emerald-500/20"
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
                      {t.completed && <CircleCheckBig className="h-4 w-4" />}
                    </button>

                    <div className="truncate">
                      <p className={`text-xs font-bold truncate text-slate-900 dark:text-slate-100 ${t.completed ? "line-through text-slate-500" : ""}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">{t.crop}</span>
                        <span className={`text-[9px] uppercase font-bold ${t.priority === "high" ? "text-rose-500" : t.priority === "medium" ? "text-amber-500" : "text-slate-500"}`}>{translate(`priority.${t.priority}`, t.priority)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.date}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Creator Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{translate("calendar.scheduleOperation", "Schedule Operation")}</h3>
              <p className="text-[10px] text-slate-400">{translate("calendar.scheduleOperationDesc", "Append actionable crop items")}</p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddTask} className="space-y-4 text-xs">
            <div>                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{translate("calendar.operationTitle", "Operation Title")}</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder={translate("calendar.operationTitlePlaceholder", "e.g. Flush drip emitters / Apply urea")} 
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{translate("calendar.cultivatedCrop", "Cultivated Crop")}</label>
                <input 
                  type="text" 
                  value={crop} 
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder={translate("calendar.cultivatedCropPlaceholder", "e.g. Paddy / Maize")} 
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{translate("calendar.targetDueDate", "Target Due Date")}</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{translate("calendar.farmingStage", "Farming Stage")}</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="sowing">{translate("taskCategoryFull.sowing", "Sowing / Bed preparation")}</option>
                  <option value="irrigation">{translate("taskCategoryFull.irrigation", "Watering / Irrigation")}</option>
                  <option value="fertilizing">{translate("taskCategoryFull.fertilizing", "Fertilizers boost")}</option>
                  <option value="spraying">{translate("taskCategoryFull.spraying", "Microbial spraying")}</option>
                  <option value="harvesting">{translate("taskCategoryFull.harvesting", "Harvest / Yield gathering")}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{translate("calendar.urgencyPriority", "Urgency Priority")}</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="low">{translate("priorityFull.low", "Low (Non-critical)")}</option>
                  <option value="medium">{translate("priorityFull.medium", "Medium (Standard)")}</option>
                  <option value="high">{translate("priorityFull.high", "High (Immediate Action)")}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-md transition-colors"
            >
              {translate("calendar.addScheduleCta", "Add Schedule Operation")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
