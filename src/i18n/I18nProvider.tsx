import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_APP_LOCALE,
  appMessages,
  type AppLocale,
  type AppMessages,
} from './messages';

const LOCALE_STORAGE_KEY = 'pydantic-playground-locale';

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  messages: AppMessages;
}

const defaultContextValue: I18nContextValue = {
  locale: DEFAULT_APP_LOCALE,
  setLocale: () => {},
  messages: appMessages[DEFAULT_APP_LOCALE],
};

const I18nContext = createContext<I18nContextValue>(defaultContextValue);

function getStoredLocale(): AppLocale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale === 'en' || storedLocale === 'vi' ? storedLocale : null;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children?: ReactNode;
  initialLocale?: AppLocale;
}) {
  const [locale, setLocale] = useState<AppLocale>(
    initialLocale ?? getStoredLocale() ?? DEFAULT_APP_LOCALE,
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      messages: appMessages[locale],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
