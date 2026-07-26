import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Trash2, 
  CircleCheck, 
  AlertTriangle,
  Beaker,
  ShieldCheck,
  ChevronRight,
  User,
  HeartPulse
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { DiseaseDetectionResult } from "../types";

export default function DiseaseDetection() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [textContext, setTextContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default pre-loaded base64 mock crop leaf image representing a spot disease to allow easy 1-click test simulation
  const SAMPLE_TOMATO_LEAF = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const handleFileChange = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError(t("disease.uploadFirst", "Please upload a leaf photograph first."));
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await api.detectDisease(image, textContext);
      setResult(res);

      // Sinks diagnostic warnings automatically into user alerts
      if (res.diseaseName && res.diseaseName.toLowerCase() !== "healthy") {
        await api.addTask({
          title: `Apply Treatment: ${res.diseaseName}`,
          date: new Date().toISOString().split("T")[0],
          crop: res.plantName,
          priority: "high",
          category: "spraying"
        });
      }
    } catch (err: any) {
      setError(err.message || t("disease.genericError", "Computer vision model failed to parse leaf spots. Ensure image contrast is high."));
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePreset = () => {
    setImage(SAMPLE_TOMATO_LEAF);
    setTextContext(t("disease.samplePresetText", "Tomato plants bottom leaves show concentrical yellow ring markings."));
  };

  const clearUpload = () => {
    setImage(null);
    setResult(null);
    setTextContext("");
    setError("");
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-emerald-500 animate-spin-slow" />
          {t("disease.pageTitle", "Foliage Crop Disease Diagnostics (CV Leaf Check)")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("disease.pageSubtitle", "Upload snapshots of affected leaf blades. Our vision neural models diagnose lesions, blights, and rusts, supplying biological remedies.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Upload column */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm">{t("disease.visualIntake", "Visual Evidence Intake")}</h3>
            
            {/* Drag Drop Area */}
            <div 
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={onDrag}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-400" 
                  : image 
                  ? "border-emerald-600/30 bg-slate-950/40 text-slate-300" 
                  : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-400"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {image ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400">
                    <CircleCheck className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-200">{t("disease.photoUploaded", "Foliage Photograph Uploaded")}</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 mt-2"
                  >
                    <Trash2 className="h-3 w-3" /> {t("disease.clearSnapshot", "Clear Snapshot")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-200 dark:bg-slate-800/80 rounded-xl text-slate-400 mx-auto w-fit">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">{t("disease.dragDrop", "Drag & Drop or Click to Select leaf photo")}</p>
                  <p className="text-[10px] text-slate-500">{t("disease.supportedFormats", "Supports JPG, PNG (Max 15MB)")}</p>
                </div>
              )}
            </div>

            {/* Optional contextual input */}
            <div className="text-xs">
              <label className="block text-slate-400 font-semibold mb-1">{t("disease.observationDetails", "Observation Details (Optional)")}</label>
              <textarea 
                value={textContext}
                onChange={(e) => setTextContext(e.target.value)}
                placeholder={t("disease.observationPlaceholder", "e.g. Concentric black targets observed on bottom foliage. Affecting roughly 15% of the sector.")}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleDiagnostic}
              disabled={loading || !image}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-1 transition-colors"
            >
              {loading ? t("disease.diagnosing", "Diagnosing Crop Leaf Cells...") : t("disease.runDiagnostics", "Run AI Diagnostics")}
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={loadSamplePreset}
              className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1"
            >
              <Beaker className="h-4 w-4 text-emerald-500" /> {t("disease.loadPresets", "Click to Load Leaf presets")}
            </button>
          </div>
        </div>

        {/* Diagnosis Result column */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[350px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-900/10"
              >
                <Camera className="h-10 w-10 text-teal-500/30 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-300">{t("disease.diagnosticDeskTitle", "Intelligent Diagnostic Desk")}</h4>
                <p className="text-xs max-w-sm mt-1">{t("disease.diagnosticDeskDesc", "Upload a crop leaf picture or load presets on the left. Gemini will generate a plant disease prescription report.")}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-5"
              >
                {/* Result header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 shadow-md border border-rose-500/20">
                      <HeartPulse className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-400">{t("disease.diagnosisVerdict", "Diagnosis Verdict")}</span>
                      <h3 className="text-lg font-black tracking-tight">{result.diseaseName}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("disease.cropLabel", "Crop")}: {result.plantName}</p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">{t("disease.diagnosticConfidence", "Diagnostic Confidence")}</span>
                    <span className="text-xl font-black font-mono text-emerald-400">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Symptoms list */}
                <div className="text-xs">
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> {t("disease.symptomsIdentified", "Symptoms Identified")}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {result.symptoms.map((sym, idx) => (
                      <li key={idx}>{sym}</li>
                    ))}
                  </ul>
                </div>

                {/* Treatment details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> {t("disease.organicCure", "Organic / Biological Cure")}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{result.organicCure}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <Beaker className="h-4 w-4" /> {t("disease.chemicalCure", "Recommended Chemical Cure")}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{result.chemicalCure}</p>
                  </div>
                </div>

                {/* Prevention guidelines */}
                <div className="text-xs pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <h4 className="font-bold text-slate-200 mb-2">{t("disease.preventionTips", "Proactive Hygiene & Prevention Tips")}</h4>
                  <ul className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {result.preventionTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Expert critical flag */}
                {result.expertOpinionNeeded && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-[10px] text-rose-400">
                    <User className="h-4.5 w-4.5 shrink-0 animate-bounce" />
                    <span>{t("disease.criticalNote", "CRITICAL: Outbreak severity is high. An in-person agricultural expert review is highly advised.")}</span>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
