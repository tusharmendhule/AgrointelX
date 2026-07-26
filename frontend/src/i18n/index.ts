import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";

// NOTE on English: every t("some.key", "English fallback text") call in the
// app already carries its own English string as the i18next defaultValue.
// Because "en" has no resource bundle below, i18next always resolves to that
// inline defaultValue for English, so we don't need to duplicate every string
// into a third JSON file — only Hindi and Marathi need translation maps here.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      hi: { translation: hi },
      mr: { translation: mr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "mr"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "agrointelx_language",
      caches: ["localStorage"],
    },
  });

export default i18n;
