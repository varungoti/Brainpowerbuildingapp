import React from "react";
import { Audio, Sequence, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { Scene } from "../components/Scene.js";
import { TitleCard } from "../components/TitleCard.js";
import { EndCard } from "../components/EndCard.js";
import type { CompositionProps } from "./schema.js";

/** 45s 9:16 (or 16:9) hero announcement: title -> scenes -> end card. */
export const HeroAnnouncement: React.FC<CompositionProps> = ({
  title,
  subtitle,
  scenes,
  voiceoverUrl,
  endCta,
  variant,
}) => {
  const { fps } = useVideoConfig();
  const titleDur = Math.round(2.5 * fps);
  const endCardDur = Math.round(3 * fps);
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
        <EndCard cta={endCta} />
      </Sequence>
    </BrandFrame>
  );
};
