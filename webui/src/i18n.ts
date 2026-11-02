import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './i18n/es.json';
import en from './i18n/en.json';

/** Adding a language = one JSON file here + one entry in RESOURCES and LANGS. */
export const RESOURCES = {
  es: { translation: es },
  en: { translation: en },
};

export const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

const saved = localStorage.getItem('hakku.lang');
i18next.use(initReactI18next).init({
  resources: RESOURCES,
  lng: saved && saved in RESOURCES ? saved : 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string): void {
  localStorage.setItem('hakku.lang', lang);
  void i18next.changeLanguage(lang);
}
