import React from "react";
import { Audio, Sequence, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { Scene } from "../components/Scene.js";
import { TitleCard } from "../components/TitleCard.js";
import { Caption } from "../components/Caption.js";
import { EndCard } from "../components/EndCard.js";
import { brand } from "../brand/theme.js";
import type { CompositionProps } from "./schema.js";

/** 60s 16:9 research explainer with citation badge. */
export const ResearchExplainer: React.FC<CompositionProps> = ({
  title,
  subtitle,
  scenes,
  voiceoverUrl,
  variant,
}) => {
  const { fps } = useVideoConfig();
  const titleDur = Math.round(3 * fps);
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
        return (
          <Sequence key={i} from={start} durationInFrames={Math.round(s.duration * fps)}>
            <Scene scene={s} startFrame={0} fps={fps} />
            {subtitle ? (
              <div
                style={{
                  position: "absolute",
                  top: 32,
                  right: 32,
                  background: brand.colors.primary,
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontFamily: brand.fonts.mono,
                  fontSize: 24,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </Sequence>
        );
      })}
      {scenes.flatMap((s) => s.words ?? []).length > 0 ? (
        <Caption words={scenes.flatMap((s) => s.words ?? [])} fontSize={48} position="bottom" />
      ) : null}
      <Sequence from={cursor} durationInFrames={endCardDur}>
        <EndCard />
      </Sequence>
    </BrandFrame>
  );
};
