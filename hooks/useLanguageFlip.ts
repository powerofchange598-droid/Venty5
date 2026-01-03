export const useLanguageFlip = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }
};
