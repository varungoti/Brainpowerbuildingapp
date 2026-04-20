import React from "react";
import { Audio, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { brand } from "../brand/theme.js";
import { Caption } from "../components/Caption.js";
import type { CompositionProps } from "./schema.js";

/** 15s parent quote with animated illustration backdrop. */
export const TestimonialCard: React.FC<CompositionProps> = ({
  title,
  subtitle,
  scenes,
  voiceoverUrl,
  variant,
}) => {
  useVideoConfig();
  const allWords = scenes.flatMap((s) => s.words ?? []);
  return (
    <BrandFrame variant={variant ?? "dark"}>
      {voiceoverUrl ? <Audio src={voiceoverUrl} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 100,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: brand.fonts.display,
            fontWeight: 700,
            fontSize: 78,
            lineHeight: 1.2,
            color: "#F8FAFC",
            margin: 0,
          }}
        >
          “{title}”
        </p>
        {subtitle ? (
          <p
            style={{
              marginTop: 40,
              fontFamily: brand.fonts.body,
              color: "#CBD5E1",
              fontSize: 36,
            }}
          >
            — {subtitle}
          </p>
        ) : null}
      </div>
      {allWords.length > 0 ? <Caption words={allWords} fontSize={42} position="bottom" /> : null}
    </BrandFrame>
  );
};
