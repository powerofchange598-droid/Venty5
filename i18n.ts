import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const savedLang = (() => {
  try {
    return localStorage.getItem('ventyLang') || '';
  } catch {
    return '';
  }
})();
const navigatorLang = typeof navigator !== 'undefined' ? (navigator.language || 'en').split('-')[0] : 'en';
const initialLng = savedLang || navigatorLang || 'en';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    returnNull: false,
    parseMissingKeyHandler: (key) => {
      const parts = String(key).split('.');
      return parts[parts.length - 1] || key;
    },
  });

if (typeof document !== 'undefined') {
  const lang = i18n.language || 'en';
  const dir = ['ar', 'fa', 'ur', 'he'].includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
  try { localStorage.setItem('ventyLang', lang); } catch {}
}

export default i18n;
