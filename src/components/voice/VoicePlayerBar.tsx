import React, { useState, useCallback, useEffect } from "react";
import { speak, stop, isVoiceAvailable, getSpeechLang } from "../../lib/voice/voiceNarrator";

interface Props {
  text: string;
  locale?: string;
}

export function VoicePlayerBar({ text, locale = "en" }: Props) {
  const [playing, setPlaying] = useState(false);
  const available = isVoiceAvailable();

  useEffect(() => {
    return () => { stop(); };
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      const started = speak(text, {
        lang: getSpeechLang(locale),
        onEnd: () => setPlaying(false),
        onError: () => setPlaying(false),
      });
      if (started) setPlaying(true);
    }
  }, [playing, text, locale]);

  if (!available) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
      style={{
        background: playing ? "rgba(239,68,68,0.08)" : "rgba(67,97,238,0.08)",
        color: playing ? "#EF4444" : "#4361EE",
      }}
    >
      <span>{playing ? "⏹️" : "🔊"}</span>
      <span className="text-xs font-medium">{playing ? "Stop" : "Voice Mode"}</span>
      {playing && (
        <span className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-0.5 rounded-full"
              style={{
                height: 8 + Math.random() * 8,
                background: "#EF4444",
                animation: `pulse 0.5s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
