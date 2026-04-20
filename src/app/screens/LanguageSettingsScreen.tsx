import React from "react";
import { useApp, type SupportedLocale } from "../context/AppContext";

const LANGUAGES: { id: SupportedLocale; label: string; native: string; group: string }[] = [
  { id: "en", label: "English", native: "English", group: "Global" },
  { id: "hi", label: "Hindi", native: "हिन्दी", group: "Indian" },
  { id: "ta", label: "Tamil", native: "தமிழ்", group: "Indian" },
  { id: "te", label: "Telugu", native: "తెలుగు", group: "Indian" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ", group: "Indian" },
  { id: "ml", label: "Malayalam", native: "മലയാളം", group: "Indian" },
  { id: "bn", label: "Bengali", native: "বাংলা", group: "Indian" },
  { id: "mr", label: "Marathi", native: "मराठी", group: "Indian" },
  { id: "gu", label: "Gujarati", native: "ગુજરાતી", group: "Indian" },
  { id: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", group: "Indian" },
  { id: "or", label: "Odia", native: "ଓଡ଼ିଆ", group: "Indian" },
  { id: "as", label: "Assamese", native: "অসমীয়া", group: "Indian" },
  { id: "ur", label: "Urdu", native: "اردو", group: "Indian" },
  { id: "zh-CN", label: "Mandarin", native: "中文", group: "East Asian" },
  { id: "ja", label: "Japanese", native: "日本語", group: "East Asian" },
  { id: "ko", label: "Korean", native: "한국어", group: "East Asian" },
  { id: "es", label: "Spanish", native: "Español", group: "European" },
  { id: "fr", label: "French", native: "Français", group: "European" },
  { id: "pt", label: "Portuguese", native: "Português", group: "European" },
  { id: "de", label: "German", native: "Deutsch", group: "European" },
  { id: "it", label: "Italian", native: "Italiano", group: "European" },
  { id: "nl", label: "Dutch", native: "Nederlands", group: "European" },
  { id: "ru", label: "Russian", native: "Русский", group: "European" },
  { id: "pl", label: "Polish", native: "Polski", group: "European" },
  { id: "ar", label: "Arabic", native: "العربية", group: "Middle East" },
  { id: "tr", label: "Turkish", native: "Türkçe", group: "Middle East" },
  { id: "sw", label: "Swahili", native: "Kiswahili", group: "Africa" },
  { id: "fa", label: "Persian", native: "فارسی", group: "Middle East" },
  { id: "th", label: "Thai", native: "ไทย", group: "Southeast Asian" },
  { id: "vi", label: "Vietnamese", native: "Tiếng Việt", group: "Southeast Asian" },
  { id: "id", label: "Indonesian", native: "Bahasa Indonesia", group: "Southeast Asian" },
  { id: "ms", label: "Malay", native: "Bahasa Melayu", group: "Southeast Asian" },
];

export function LanguageSettingsScreen() {
  const { locale, setLocale, goBack } = useApp();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Language</h2>
        <p className="text-xs text-gray-500">Select your preferred language</p>
      </div>

      <div className="space-y-1.5">
        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            onClick={() => {
              setLocale(lang.id);
              goBack();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
            style={{
              borderColor: locale === lang.id ? "#4361EE" : "#E5E7EB",
              background: locale === lang.id ? "rgba(67,97,238,0.06)" : "white",
            }}
          >
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">{lang.native}</div>
              <div className="text-[10px] text-gray-500">{lang.label}</div>
            </div>
            {locale === lang.id && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#4361EE" }}>
                <span className="text-white text-[10px]">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
