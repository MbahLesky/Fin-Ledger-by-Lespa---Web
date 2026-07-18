import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";
import { DEFAULT_LANGUAGE } from "@/lib/constants";

// English + French to match the Flutter app. The active language is driven by
// AppSettings.language (see useLanguageSync); i18n starts on the default and is
// switched once local settings hydrate.
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr }
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
