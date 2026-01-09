import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en',
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
  document.documentElement.setAttribute('dir', 'ltr');
  document.documentElement.setAttribute('lang', 'en');
}

export default i18n;
