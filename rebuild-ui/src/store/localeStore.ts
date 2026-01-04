import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'ko';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

interface LocaleState {
  locale: Locale;
  translations: Record<string, unknown>;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  loadTranslations: (locale: Locale) => Promise<void>;
}

// Flatten nested object to dot notation keys
const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
};

// Get browser locale
const getBrowserLocale = (): Locale => {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language.split('-')[0];
  const supported = SUPPORTED_LOCALES.find(l => l.code === browserLang);
  return supported ? supported.code : 'en';
};

// Load translations from file
const loadTranslationsFromFile = async (locale: Locale): Promise<Record<string, unknown>> => {
  try {
    // In development, load from rebuild-config
    const response = await fetch(`/config/locales/${locale}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    console.warn(`Failed to load translations for ${locale}`);
  }
  return {};
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en' as Locale,
      translations: {},

      setLocale: async (locale: Locale) => {
        await get().loadTranslations(locale);
        set({ locale });

        // Update document lang attribute
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
      },

      loadTranslations: async (locale: Locale) => {
        const translations = await loadTranslationsFromFile(locale);
        set({ translations });
      },

      t: (key: string, params?: Record<string, string | number>): string => {
        const { translations } = get();
        const flatTranslations = flattenObject(translations);
        let value = flatTranslations[key] || key;

        // Replace template parameters like {{count}}
        if (params) {
          Object.entries(params).forEach(([paramKey, paramValue]) => {
            value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
          });
        }

        return value;
      },
    }),
    {
      name: 'rebuild-locale',
      partialize: (state) => ({
        locale: state.locale,
      }),
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // Load translations for stored locale
          await state.loadTranslations(state.locale);

          // Update document lang
          if (typeof document !== 'undefined') {
            document.documentElement.lang = state.locale;
          }
        }
      },
    }
  )
);

// Initialize on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('rebuild-locale');
  let initialLocale: Locale = 'en';

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      initialLocale = parsed.state?.locale || getBrowserLocale();
    } catch {
      initialLocale = getBrowserLocale();
    }
  } else {
    initialLocale = getBrowserLocale();
  }

  // Set document lang immediately
  document.documentElement.lang = initialLocale;

  // Load translations
  useLocaleStore.getState().loadTranslations(initialLocale);
}
