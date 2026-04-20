import React from "react";
import { Audio, Sequence, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { Scene } from "../components/Scene.js";
import { TitleCard } from "../components/TitleCard.js";
import { EndCard } from "../components/EndCard.js";
import type { CompositionProps } from "./schema.js";

/** 20s focused single-feature spotlight: 1.5s title + 3 scenes + 1.5s end. */
export const FeatureSpotlight: React.FC<CompositionProps> = ({
  title,
  subtitle,
  scenes,
  voiceoverUrl,
  endCta,
  variant,
}) => {
  const { fps } = useVideoConfig();
  const titleDur = Math.round(1.5 * fps);
  const endCardDur = Math.round(1.5 * fps);
  let cursor = titleDur;
  return (
    <BrandFrame variant={variant}>
      {voiceoverUrl ? <Audio src={voiceoverUrl} /> : null}
      <Sequence from={0} durationInFrames={titleDur}>
        <TitleCard title={title} subtitle={subtitle} variant={variant} />
      </Sequence>
      {scenes.map((s, i) => {
        const start = cursor;
        cursor += Math.round(s.duration * fps);
        return <Scene key={i} scene={s} startFrame={start} fps={fps} />;
      })}
      <Sequence from={cursor} durationInFrames={endCardDur}>
        <EndCard cta={endCta} showQR={false} />
      </Sequence>
    </BrandFrame>
  );
};
