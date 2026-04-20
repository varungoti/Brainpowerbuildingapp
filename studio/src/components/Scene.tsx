import React from "react";
import { Audio, OffthreadVideo, Sequence } from "remotion";
import { Caption, type WordTiming } from "./Caption.js";
import { KenBurnsImage } from "./KenBurnsImage.js";

export interface ScenePlan {
  /** seconds */
  duration: number;
  /** image url (used when no videoUrl) */
  imageUrl?: string;
  /** AI-generated b-roll clip url (image-to-video output) */
  videoUrl?: string;
  /** caption words to render under the scene; their startMs is relative to scene start */
  words?: WordTiming[];
  motion?: "in" | "out" | "pan-l" | "pan-r" | "pan-up" | "pan-down";
}

interface Props {
  scene: ScenePlan;
  /** scene start in frames within parent composition */
  startFrame: number;
  fps: number;
  /** voiceover audio for this scene; sliced caller-side */
  audioUrl?: string;
}

export const Scene: React.FC<Props> = ({ scene, startFrame, fps, audioUrl }) => {
  const durationInFrames = Math.round(scene.duration * fps);
  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      {scene.videoUrl ? (
        <OffthreadVideo src={scene.videoUrl} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : scene.imageUrl ? (
        <KenBurnsImage src={scene.imageUrl} motion={scene.motion ?? "in"} />
      ) : null}
      {scene.words && scene.words.length > 0 ? <Caption words={scene.words} /> : null}
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </Sequence>
  );
};
