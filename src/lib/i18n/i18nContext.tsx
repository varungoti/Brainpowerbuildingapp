import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { SupportedLocale } from "../../app/context/AppContext";

type Translations = Record<string, string>;

interface I18nCtx {
  locale: SupportedLocale;
  translations: Translations;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (l: SupportedLocale) => void;
  ready: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

const cache = new Map<SupportedLocale, Translations>();

async function loadTranslations(locale: SupportedLocale): Promise<Translations> {
  if (cache.has(locale)) return cache.get(locale)!;
  try {
    const mod = await import(`../../locale/${locale}.json`);
    const data: Translations = mod.default ?? mod;
    cache.set(locale, data);
    return data;
  } catch {
    if (locale !== "en") return loadTranslations("en");
    return {};
  }
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function I18nProvider({ locale: initialLocale, onLocaleChange, children }: {
  locale: SupportedLocale;
  onLocaleChange: (l: SupportedLocale) => void;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const [fallback, setFallback] = useState<Translations>({});
  const [ready, setReady] = useState(false);

  useEffect(() => { setLocaleState(initialLocale); }, [initialLocale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tr, fb] = await Promise.all([
        loadTranslations(locale),
        locale !== "en" ? loadTranslations("en") : Promise.resolve({}),
      ]);
      if (cancelled) return;
      setTranslations(tr);
      setFallback(fb);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((l: SupportedLocale) => {
    setLocaleState(l);
    onLocaleChange(l);
  }, [onLocaleChange]);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const raw = translations[key] ?? fallback[key] ?? key;
    return interpolate(raw, vars);
  }, [translations, fallback]);

  return <Ctx.Provider value={{ locale, translations, t, setLocale, ready }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
