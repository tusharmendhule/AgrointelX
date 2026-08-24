import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Search, Navigation, X, Loader2, Check, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "../context/LocationContext";

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelector({ isOpen, onClose }: LocationSelectorProps) {
  const { t } = useTranslation();
  const {
    lat, lon, locationName, permissionState, isLoading, error,
    requestLocation, setManualLocation, searchLocations
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lon: number; name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [activeTab, setActiveTab] = useState<"auto" | "search" | "manual">("auto");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, searchLocations]);

  const handleSelectResult = (result: { lat: number; lon: number; name: string }) => {
    setManualLocation(result.name, result.lat, result.lon);
    onClose();
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;
    await setManualLocation(manualInput.trim());
    onClose();
  };

  const handleAutoLocation = () => {
    requestLocation();
    // Don't close immediately - wait for result
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Set Farm Location</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">For accurate weather and recommendations</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Current Location Display */}
          {locationName && (
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Current: {locationName}</span>
                {lat && lon && (
                  <span className="text-[9px] text-slate-400 font-mono">({lat.toFixed(2)}, {lon.toFixed(2)})</span>
                )}
              </div>
            </div>
          )}

          {/* Tab Buttons */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("auto")}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === "auto"
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Navigation className="h-3.5 w-3.5 inline mr-1.5" />
              Auto Detect
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === "search"
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Search className="h-3.5 w-3.5 inline mr-1.5" />
              Search
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === "manual"
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 inline mr-1.5" />
              Manual
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Auto Detect Tab */}
            {activeTab === "auto" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  AgroIntelX uses your location to provide local weather and farming recommendations.
                </p>
                <button
                  onClick={handleAutoLocation}
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {isLoading ? "Getting your location..." : "Allow Location Access"}
                </button>
                {error && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 text-center">
                  You can always enter your location manually instead.
                </p>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, state, or region..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectResult(result)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                      >
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{result.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{result.lat.toFixed(2)}°N, {result.lon.toFixed(2)}°E</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No locations found. Try a different search.</p>
                )}
              </div>
            )}

            {/* Manual Tab */}
            {activeTab === "manual" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter your farm location (city, state, or region).
                </p>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. Nagpur, Maharashtra, India"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {isLoading ? "Setting location..." : "Set Location"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
