import React from "react";
import { Audio, Sequence, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { Scene } from "../components/Scene.js";
import { TitleCard } from "../components/TitleCard.js";
import { EndCard } from "../components/EndCard.js";
import type { CompositionProps } from "./schema.js";

/**
 * 25s app demo. Scenes are screen recordings (videoUrl) shown inside an
 * animated phone mockup. If no recordings provided, falls back to images.
 */
const PhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 480,
        height: 980,
        borderRadius: 64,
        background: "#0F172A",
        padding: 16,
        boxShadow: "0 60px 120px rgba(0,0,0,0.5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  </div>
);

export const AppDemo: React.FC<CompositionProps> = ({
  title,
  subtitle,
  scenes,
  voiceoverUrl,
  endCta,
  variant,
}) => {
  const { fps } = useVideoConfig();
  const titleDur = Math.round(2 * fps);
  const endCardDur = Math.round(2 * fps);
  let cursor = titleDur;
  return (
    <BrandFrame variant={variant ?? "dark"}>
      {voiceoverUrl ? <Audio src={voiceoverUrl} /> : null}
      <Sequence from={0} durationInFrames={titleDur}>
        <TitleCard title={title} subtitle={subtitle} variant="dark" />
      </Sequence>
      {scenes.map((s, i) => {
        const start = cursor;
        cursor += Math.round(s.duration * fps);
        return (
          <Sequence key={i} from={start} durationInFrames={Math.round(s.duration * fps)}>
            <PhoneMockup>
              <Scene scene={s} startFrame={0} fps={fps} />
            </PhoneMockup>
          </Sequence>
        );
      })}
      <Sequence from={cursor} durationInFrames={endCardDur}>
        <EndCard cta={endCta} />
      </Sequence>
    </BrandFrame>
  );
};
