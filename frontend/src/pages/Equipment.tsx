import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Wrench, 
  Plus, 
  Trash2, 
  ChevronRight, 
  CircleAlert,
  TrendingDown,
  Clock,
  ArrowUpRight,
  Filter,
  CircleCheck,
  Gauge
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Equipment } from "../types";

export default function EquipmentPage() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [status, setStatus] = useState<any>("operational");
  const [lastMaintenance, setLastMaintenance] = useState(new Date().toISOString().split("T")[0]);
  const [nextService, setNextService] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadEquipment() {
      try {
        const list = await api.getEquipment();
        setEquipment(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEquipment();
  }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name || !nextService) {
      setFormError(t("equipment.fieldsMandatory", "All parameters are mandatory."));
      return;
    }

    try {
      const added = await api.addEquipment({
        name,
        status,
        lastMaintenance,
        nextService
      });
      setEquipment(prev => [...prev, added]);
      setName("");
      setNextService("");
    } catch (err: any) {
      setFormError(err.message || t("equipment.addFailed", "Failed to add machinery."));
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await api.deleteEquipment(id);
      setEquipment(prev => prev.filter(eq => eq.id !== id));
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
          <Wrench className="h-8 w-8 text-emerald-500" />
          {t("equipment.pageTitle", "Heavy Machinery & Farm Equipment Ledgers")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("equipment.pageSubtitle", "Monitor your mechanical assets, preventative service logs, diesel tank indices, and field hour operations.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Equipment displays */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="font-bold text-sm">{t("equipment.fleetStatus", "Fleet Status Indicators")}</h3>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold">
              {t("equipment.machineryOnline", "{{count}} Machinery Online", { count: equipment.filter(eq => eq.status === "operational").length })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {equipment.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 col-span-2">{t("equipment.noAssets", "No heavy equipment assets logged. Log tools on the right.")}</p>
            ) : (
              equipment.map((eq) => (
                <div 
                  key={eq.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 flex flex-col justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        eq.status === "operational" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : eq.status === "maintenance" 
                          ? "bg-amber-500/10 text-amber-400" 
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {t(`equipmentStatus.${eq.status}`, eq.status)}
                      </span>
                      <button 
                        onClick={() => handleDeleteEquipment(eq.id)}
                        className="text-slate-500 hover:text-rose-500 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100">{eq.name}</h4>
                    
                    <div className="space-y-1 mt-3 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>{t("equipment.lastCalibration", "Last Calibration")}:</span>
                        <span className="font-mono text-slate-300">{eq.lastMaintenance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("equipment.nextServiceDue", "Next Service Due")}:</span>
                        <span className="font-mono text-slate-300 font-bold">{eq.nextService}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Gauge className="h-3.5 w-3.5 text-emerald-500" /> {t("equipment.fuelReserve", "Fuel Reserve")}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{t("equipment.fuelFull", "82% Full")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create machine */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t("equipment.registerMachinery", "Register Machinery")}</h3>
              <p className="text-[10px] text-slate-400">{t("equipment.registerMachineryDesc", "Add heavy machinery details")}</p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddEquipment} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("equipment.machineName", "Equipment / Machine Name")}</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder={t("equipment.machineNamePlaceholder", "e.g. Mahindra Arjun 555 DI Tractor")} 
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t("equipment.fleetStatusLabel", "Fleet Status")}</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="operational">{t("equipmentStatusFull.operational", "Operational (Online)")}</option>
                <option value="maintenance">{t("equipmentStatusFull.maintenance", "Preventative Maintenance")}</option>
                <option value="repair">{t("equipmentStatusFull.repair", "Under repair")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("equipment.lastCalibrationDate", "Last Calibration Date")}</label>
                <input 
                  type="date" 
                  value={lastMaintenance} 
                  onChange={(e) => setLastMaintenance(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t("equipment.nextServiceDue", "Next Service Due")}</label>
                <input 
                  type="date" 
                  value={nextService} 
                  onChange={(e) => setNextService(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-1 shadow-md transition-colors"
            >
              {t("equipment.logAssetCta", "Log Heavy Asset")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
