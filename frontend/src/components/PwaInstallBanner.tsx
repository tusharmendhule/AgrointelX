import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const DISMISS_KEY = "agrointelx_pwa_dismissed";
const INSTALL_KEY = "agrointelx_pwa_installed";

/** Detect iOS Safari (no beforeinstallprompt support) */
function isIOS(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

export default function PwaInstallBanner() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Already installed or previously dismissed
    if (localStorage.getItem(INSTALL_KEY) === "true") {
      setInstalled(true);
      return;
    }
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      return;
    }

    // iOS: show manual instructions
    if (isIOS()) {
      setIsIOSDevice(true);
      // Only show after a short delay so the page loads first
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowBanner(false);
      localStorage.setItem(INSTALL_KEY, "true");
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
      localStorage.setItem(INSTALL_KEY, "true");
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  // Already installed — nothing to show
  if (installed) return null;

  return (
    <>
      {/* iOS instructions modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSInstructions(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10"
            >
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {t("pwa.installOnIOS", "Install on iPhone / iPad")}
                </h3>
              </div>

              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                <li>
                  {t("pwa.iosStep1", 'Tap the')}{" "}
                  <span className="font-bold text-white">Share</span>{" "}
                  {t("pwa.iosStep1b", "button (square with arrow) in Safari")}
                </li>
                <li>
                  {t("pwa.iosStep2", 'Scroll down and tap')}{" "}
                  <span className="font-bold text-white">
                    {t("pwa.iosStep2Action", '"Add to Home Screen"')}
                  </span>
                </li>
                <li>
                  {t("pwa.iosStep3", "Tap")}{" "}
                  <span className="font-bold text-white">{t("pwa.iosStep3Action", "Add")}</span>{" "}
                  {t("pwa.iosStep3b", "in the top-right corner")}
                </li>
              </ol>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {t("pwa.iosGotIt", "Got it!")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom install banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none"
          >
            <div className="max-w-lg mx-auto pointer-events-auto bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-emerald-500/20 rounded-2xl p-4 shadow-2xl shadow-emerald-500/5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl shrink-0 mt-0.5">
                  <Download className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">
                    {t("pwa.bannerTitle", "Install AgroIntelX")}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {t(
                      "pwa.bannerDesc",
                      "Add to your home screen for instant access — works offline, faster load times."
                    )}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {isIOSDevice ? (
                      <button
                        onClick={() => setShowIOSInstructions(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        {t("pwa.installButton", "Install")}
                      </button>
                    ) : (
                      <button
                        onClick={handleInstall}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("pwa.installButton", "Install")}
                      </button>
                    )}
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      {t("pwa.notNow", "Not now")}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
