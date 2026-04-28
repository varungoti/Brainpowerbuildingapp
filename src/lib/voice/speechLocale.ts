/**
 * Speech engines (SFSpeechRecognizer, Android SpeechRecognizer, Web Speech API)
 * need full BCP-47 tags (e.g. en-US). Bare ISO-639 codes like "en" often fail
 * with language-not-supported.
 */

const LANG_DEFAULT_REGION: Record<string, string> = {
  en: "US",
  es: "ES",
  fr: "FR",
  de: "DE",
  hi: "IN",
  pt: "BR",
  ja: "JP",
  zh: "CN",
  ar: "SA",
  ta: "IN",
  te: "IN",
  kn: "IN",
  ml: "IN",
  bn: "IN",
  mr: "IN",
  gu: "IN",
  pa: "IN",
  ur: "PK",
  ru: "RU",
  it: "IT",
  ko: "KR",
  nl: "NL",
  pl: "PL",
  tr: "TR",
  vi: "VN",
  th: "TH",
};

/**
 * Normalize a UI or content locale string for native speech APIs.
 */
export function normalizeSpeechLocale(preferred?: string | null): string {
  let raw = (preferred ?? "").trim().replace(/_/g, "-");
  if (!raw) {
    raw = typeof navigator !== "undefined" && navigator.language ? navigator.language.trim().replace(/_/g, "-") : "en-US";
  }
  const parts = raw.split("-").filter(Boolean);
  if (parts.length === 1 && /^[a-zA-Z]{2}$/.test(parts[0])) {
    const lang = parts[0].toLowerCase();
    const region = LANG_DEFAULT_REGION[lang];
    if (region) return `${lang}-${region}`;
    if (typeof navigator !== "undefined" && navigator.language) {
      const nav = navigator.language.replace(/_/g, "-");
      if (nav.toLowerCase().startsWith(`${lang}-`)) return nav;
      if (nav.slice(0, 2).toLowerCase() === lang) return nav;
    }
    return `${lang}-US`;
  }
  if (parts.length >= 2) {
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}${parts.length > 2 ? "-" + parts.slice(2).join("-") : ""}`;
  }
  return "en-US";
}
