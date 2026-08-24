import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  ChevronRight, 
  CircleAlert,
  TrendingDown,
  Clock,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Expense } from "../types";

export default function Expenses() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [category, setCategory] = useState<any>("seeds");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadExpenses() {
      try {
        const list = await api.getExpenses();
        setExpenses(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!amount || parseFloat(amount) <= 0) {
      setFormError(t("expenses.invalidAmount", "Please enter a valid expense amount."));
      return;
    }

    try {
      const added = await api.addExpense({
        category,
        amount: parseFloat(amount),
        date,
        description
      });
      setExpenses(prev => [...prev, added]);
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setFormError(err.message || t("expenses.logFailed", "Failed to log expense."));
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const totalSum = expenses.reduce((sum, e) => sum + e.amount, 0);

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
          <Wallet className="h-8 w-8 text-emerald-500" />
          {t("expenses.pageTitle", "Financial Ledger & Resource Expenditures")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("expenses.pageSubtitle", "Monitor your agricultural operating expenses, seed and fertilizer acquisitions, and heavy labor wages.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Ledger display */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{t("expenses.ledgerSummary", "Ledger Summary")}</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalSum.toLocaleString()}</h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
              {t("expenses.entriesActive", "{{count}} Entries Active", { count: expenses.length })}
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">{t("expenses.noEntries", "No expense ledger entries logged. Add seed/labor costs on the right pane.")}</p>
            ) : (
              expenses.map((e) => (
                <div 
                  key={e.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-emerald-500 rounded-xl">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{e.description || t("expenses.unspecifiedCost", "Unspecified {{category}} cost", { category: e.category })}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">{t(`expenseCategory.${e.category}`, e.category)}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{e.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-extrabold">₹{e.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handleDeleteExpense(e.id)}
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

        {/* Form log expense */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("expenses.logNew", "Log New Expenditure")}</h3>
              <p className="text-[10px] text-slate-400">{t("expenses.logNewDesc", "Append transaction records immediately")}</p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
            <div>                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("expenses.category", "Expense Category")}</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="seeds">{t("expenseCategory.seeds", "Crop Seeds Acquisition")}</option>
                <option value="fertilizer">{t("expenseCategory.fertilizer", "Fertilizers & Nutrients")}</option>
                <option value="pesticides">{t("expenseCategory.pesticides", "Fungal/Bio Pesticides")}</option>
                <option value="labor">{t("expenseCategory.labor", "Hired Daily Labor Wages")}</option>
                <option value="fuel">{t("expenseCategory.fuel", "Diesel / Tractor Fuel")}</option>
                <option value="equipment">{t("expenseCategory.equipment", "Machinery Rentals")}</option>
                <option value="other">{t("expenseCategory.other", "Miscellaneous Expenditures")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("expenses.amount", "Amount (INR ₹)")}</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500" 
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("expenses.transactionDate", "Transaction Date")}</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t("expenses.description", "Description / Particulars")}</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("expenses.descriptionPlaceholder", "e.g. Basmati Paddy Seeds 50kg bag")} 
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-md transition-colors"
            >
              {t("expenses.logRecordCta", "Log Expenditure Record")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
