import React from "react";
import { Composition } from "remotion";
import { HeroAnnouncement } from "./compositions/HeroAnnouncement.js";
import { FeatureSpotlight } from "./compositions/FeatureSpotlight.js";
import { TestimonialCard } from "./compositions/TestimonialCard.js";
import { BrainStoryShort } from "./compositions/BrainStoryShort.js";
import { ResearchExplainer } from "./compositions/ResearchExplainer.js";
import { AppDemo } from "./compositions/AppDemo.js";
import { compositionPropsSchema, type CompositionProps } from "./compositions/schema.js";

const defaultProps: CompositionProps = {
  title: "Build the AI-age brain",
  subtitle: "60 minutes a week. 15 brain regions. Zero screens after the activity.",
  scenes: [
    {
      duration: 4,
      imageUrl: "https://placehold.co/1080x1920/7C3AED/FFFFFF/png?text=Scene+1",
      motion: "in",
    },
    {
      duration: 4,
      imageUrl: "https://placehold.co/1080x1920/06B6D4/FFFFFF/png?text=Scene+2",
      motion: "pan-l",
    },
  ],
  variant: "dark",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroAnnouncement"
        component={HeroAnnouncement}
        durationInFrames={45 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const total =
            (2.5 + 3) +
            props.scenes.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
          return { durationInFrames: Math.max(60, Math.round(total * fps)) };
        }}
      />
      <Composition
        id="FeatureSpotlight"
        component={FeatureSpotlight}
        durationInFrames={20 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const total =
            (1.5 + 1.5) +
            props.scenes.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
          return { durationInFrames: Math.max(60, Math.round(total * fps)) };
        }}
      />
      <Composition
        id="TestimonialCard"
        component={TestimonialCard}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
      />
      <Composition
        id="BrainStoryShort"
        component={BrainStoryShort}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const total =
            2.5 + props.scenes.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
          return { durationInFrames: Math.max(60, Math.round(total * fps)) };
        }}
      />
      <Composition
        id="ResearchExplainer"
        component={ResearchExplainer}
        durationInFrames={60 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const total =
            (3 + 3) +
            props.scenes.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
          return { durationInFrames: Math.max(60, Math.round(total * fps)) };
        }}
      />
      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={25 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        schema={compositionPropsSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const total =
            (2 + 2) +
            props.scenes.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
          return { durationInFrames: Math.max(60, Math.round(total * fps)) };
        }}
      />
    </>
  );
};
