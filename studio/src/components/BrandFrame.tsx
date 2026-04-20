import React from "react";
import { AbsoluteFill } from "remotion";
import { brand } from "../brand/theme.js";

interface Props {
  children: React.ReactNode;
  variant?: "light" | "dark";
}

export const BrandFrame: React.FC<Props> = ({ children, variant = "light" }) => {
  const bg = variant === "dark" ? brand.colors.bgDark : brand.colors.bg;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at top, ${
          variant === "dark" ? "#1A1A2E" : "#FFFFFF"
        }, ${bg})`,
        fontFamily: brand.fonts.body,
        color: variant === "dark" ? "#F8FAFC" : brand.colors.ink,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
