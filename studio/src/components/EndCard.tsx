import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand/theme.js";

interface Props {
  cta?: string;
  showQR?: boolean;
}

export const EndCard: React.FC<Props> = ({ cta = brand.cta, showQR = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.primaryDark})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        opacity,
        color: "#fff",
        padding: 80,
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: brand.fonts.display,
          fontWeight: 900,
          fontSize: 88,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {cta}
      </h2>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <Img src={brand.appStoreBadgeUrl} style={{ height: 120 }} />
        <Img src={brand.playStoreBadgeUrl} style={{ height: 120 }} />
        {showQR ? (
          <div
            style={{
              padding: 16,
              background: "white",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img src={brand.qrUrl} style={{ width: 180, height: 180 }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
