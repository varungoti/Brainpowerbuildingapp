import React from "react";
import { useApp, type SupportedLocale } from "../context/AppContext";

const LANGUAGES: { id: SupportedLocale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "ta", label: "Tamil", native: "தமிழ்" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { id: "ml", label: "Malayalam", native: "മലയാളം" },
  { id: "bn", label: "Bengali", native: "বাংলা" },
  { id: "mr", label: "Marathi", native: "मराठी" },
  { id: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { id: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { id: "zh-CN", label: "Mandarin", native: "中文" },
  { id: "ja", label: "Japanese", native: "日本語" },
  { id: "ko", label: "Korean", native: "한국어" },
  { id: "es", label: "Spanish", native: "Español" },
  { id: "fr", label: "French", native: "Français" },
  { id: "pt", label: "Portuguese", native: "Português" },
  { id: "ar", label: "Arabic", native: "العربية" },
  { id: "sw", label: "Swahili", native: "Kiswahili" },
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
