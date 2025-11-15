import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources for English and Swahili
const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      profile: "Profile",
      settings: "Settings",
      // add other UI strings here
    },
  },
  sw: {
    translation: {
      welcome: "Karibu",
      profile: "Wasifu",
      settings: "Mipangilio",
      // translate other UI strings here
    },
  },
};

i18n
  .use(LanguageDetector) // detect user language automatically
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],

      // cache user language on
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
