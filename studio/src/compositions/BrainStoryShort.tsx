import React from "react";
import { Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandFrame } from "../components/BrandFrame.js";
import { Scene } from "../components/Scene.js";
import { Caption } from "../components/Caption.js";
import { EndCard } from "../components/EndCard.js";
import type { CompositionProps } from "./schema.js";

/**
 * 30s 9:16 short. A child does an activity; an animated brain "lights up"
 * the developing region with a glow that scales over the scene length.
 */
const BrainPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const pulse = (Math.sin(t * 4) + 1) / 2;
  const opacity = interpolate(frame, [0, durationInFrames], [0.7, 0.95]);
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        top: 64,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #F59E0B, #7C3AED 60%, transparent 75%)",
        filter: `blur(${4 + pulse * 6}px)`,
        opacity,
      }}
    />
  );
};

export const BrainStoryShort: React.FC<CompositionProps> = ({
  scenes,
  voiceoverUrl,
  endCta,
  variant,
}) => {
  const { fps } = useVideoConfig();
  const endCardDur = Math.round(2.5 * fps);
  let cursor = 0;
  return (
    <BrandFrame variant={variant ?? "dark"}>
      {voiceoverUrl ? <Audio src={voiceoverUrl} /> : null}
      <BrainPulse />
      {scenes.map((s, i) => {
        const start = cursor;
        cursor += Math.round(s.duration * fps);
        return <Scene key={i} scene={s} startFrame={start} fps={fps} />;
      })}
      {scenes.flatMap((s) => s.words ?? []).length > 0 ? (
        <Caption
          words={scenes.flatMap((s) => s.words ?? [])}
          fontSize={64}
          position="bottom"
        />
      ) : null}
      <Sequence from={cursor} durationInFrames={endCardDur}>
        <EndCard cta={endCta} />
      </Sequence>
    </BrandFrame>
  );
};
