import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en';
import es from './es';

const i18n = new I18n({
  en,
  es,
});

// Set the locale once at the beginning of your app
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale === 'es' ? 'es' : 'en';

// When a value is missing from a language it'll fallback to another language
i18n.enableFallback = true;
i18n.defaultLocale = 'es';

export const setLocale = (locale: 'es' | 'en') => {
  i18n.locale = locale;
};

export const getLocale = () => i18n.locale;

export const t = (key: string, options?: object) => i18n.t(key, options);

export default i18n;
