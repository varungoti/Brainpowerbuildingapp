import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand/theme.js";

export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

interface Props {
  words: WordTiming[];
  highlightColor?: string;
  /** "bottom" "center" "top" */
  position?: "bottom" | "center" | "top";
  fontSize?: number;
}

/**
 * Word-level animated caption. Consumes Kokoro's per-word timestamps and
 * highlights the active word like CapCut / Submagic do.
 */
export const Caption: React.FC<Props> = ({
  words,
  highlightColor = brand.colors.accentWarm,
  position = "bottom",
  fontSize = 56,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: position === "bottom" ? 120 : undefined,
        top: position === "top" ? 120 : position === "center" ? "50%" : undefined,
        transform: position === "center" ? "translateY(-50%)" : undefined,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
        padding: "0 80px",
        textAlign: "center",
        fontFamily: brand.fonts.display,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.15,
        textShadow: "0 4px 16px rgba(0,0,0,0.55)",
        color: "#FFFFFF",
        WebkitTextStroke: "1px rgba(0,0,0,0.35)",
      }}
    >
      {words.map((w, i) => {
        const active = ms >= w.startMs && ms <= w.endMs;
        const past = ms > w.endMs;
        return (
          <span
            key={`${w.word}-${i}`}
            style={{
              color: active ? highlightColor : past ? "#E2E8F0" : "#FFFFFF",
              transform: active ? "scale(1.08)" : "scale(1)",
              transition: "transform 80ms linear, color 80ms linear",
              display: "inline-block",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
