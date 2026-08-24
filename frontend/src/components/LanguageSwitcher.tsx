import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "../i18n";

interface LanguageSwitcherProps {
  /** "dark" for use on the dark landing/auth pages, "app" for the themed dashboard chrome */
  variant?: "dark" | "app";
  /** icon-only square button (matches the topbar's theme toggle), instead of the icon+label pill */
  compact?: boolean;
  className?: string;
}

export default function LanguageSwitcher({ variant = "app", compact = false, className = "" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = (SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const buttonClasses = compact
    ? "p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
    : variant === "dark"
      ? "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-medium transition-colors"
      : "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-medium transition-colors";

  const menuClasses = variant === "dark" || !variant
    ? "absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
    : "absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={buttonClasses}
        title={t("common.changeLanguage", "Change language")}
        aria-label={t("common.changeLanguage", "Change language")}
      >
        {compact ? (
          <Languages className="h-5 w-5" />
        ) : (
          <>
            <Languages className="h-3.5 w-3.5" />
            {current.nativeLabel}
          </>
        )}
      </button>

      {open && (
        <div className={menuClasses}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectLanguage(lang.code)}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs text-left transition-colors ${
                lang.code === current.code
                  ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{lang.nativeLabel}</span>
              {lang.code === current.code && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
