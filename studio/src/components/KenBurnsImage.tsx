import React from "react";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  src: string;
  /** "in" zooms in over time, "out" zooms out, "pan-l" pans left */
  motion?: "in" | "out" | "pan-l" | "pan-r" | "pan-up" | "pan-down";
  intensity?: number;
}

export const KenBurnsImage: React.FC<Props> = ({ src, motion = "in", intensity = 0.18 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

  const scaleStart = 1;
  const scaleEnd = 1 + intensity;
  const scale =
    motion === "in"
      ? interpolate(t, [0, 1], [scaleStart, scaleEnd])
      : motion === "out"
      ? interpolate(t, [0, 1], [scaleEnd, scaleStart])
      : 1 + intensity * 0.5;

  let translateX = 0;
  let translateY = 0;
  if (motion === "pan-l") translateX = interpolate(t, [0, 1], [0, -intensity * 100]);
  if (motion === "pan-r") translateX = interpolate(t, [0, 1], [0, intensity * 100]);
  if (motion === "pan-up") translateY = interpolate(t, [0, 1], [0, -intensity * 100]);
  if (motion === "pan-down") translateY = interpolate(t, [0, 1], [0, intensity * 100]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center",
        }}
      />
    </div>
  );
};
