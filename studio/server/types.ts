export type TemplateId =
  | "HeroAnnouncement"
  | "FeatureSpotlight"
  | "TestimonialCard"
  | "BrainStoryShort"
  | "ResearchExplainer"
  | "AppDemo";

export type JobStatus =
  | "queued"
  | "scripting"
  | "awaiting_approval"
  | "generating_assets"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export interface ScenePlan {
  idx: number;
  durationSec: number;
  voiceoverText: string;
  imagePrompt: string;
  brandConsistency?: "high" | "low";
  textInImage?: boolean;
  motion?: "in" | "out" | "pan-l" | "pan-r" | "pan-up" | "pan-down";
  /** if true, generate a short video clip via video-svc instead of static image */
  useVideoClip?: boolean;
  videoProvider?: string;
  imageProvider?: string;
  imageUrl?: string;
  videoUrl?: string;
  /** word-level timestamps from kokoro */
  words?: Array<{ word: string; startMs: number; endMs: number }>;
}

export interface StudioJob {
  id: string;
  template: TemplateId;
  brief: string;
  durationSec: number;
  voice: string;
  variant: "light" | "dark";
  status: JobStatus;
  title?: string;
  subtitle?: string;
  scenes: ScenePlan[];
  voiceoverUrl?: string;
  storyboardUrl?: string;
  mp4Url?: string;
  thumbnailUrl?: string;
  costUSD: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}
