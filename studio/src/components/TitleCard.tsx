import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand/theme.js";

interface Props {
  title: string;
  subtitle?: string;
  variant?: "light" | "dark";
}

export const TitleCard: React.FC<Props> = ({ title, subtitle, variant = "light" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [30, 0]);
  const fg = variant === "dark" ? "#F8FAFC" : brand.colors.ink;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
        padding: 80,
      }}
    >
      <h1
        style={{
          fontFamily: brand.fonts.display,
          fontWeight: 900,
          fontSize: 110,
          lineHeight: 1.05,
          color: fg,
          margin: 0,
          letterSpacing: "-0.02em",
          background: `linear-gradient(120deg, ${brand.colors.primary}, ${brand.colors.accent})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          style={{
            fontFamily: brand.fonts.body,
            fontWeight: 500,
            fontSize: 42,
            color: variant === "dark" ? "#CBD5E1" : brand.colors.inkSoft,
            margin: 0,
            maxWidth: 1100,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};
