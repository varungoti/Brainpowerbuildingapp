export interface VideoSpec {
  prompt: string;
  /** image-to-video init image URL */
  imageUrl?: string;
  durationSec?: number;
  /** "16:9" "9:16" "1:1" "4:3" */
  aspect?: string;
  /** "720p" "1080p" "4k" */
  resolution?: "480p" | "720p" | "1080p" | "4k";
  fps?: 24 | 30 | 60;
  seed?: number;
  /** Provider-specific style hint */
  style?: string;
  /** Native audio support (Sora 2, Veo 3) */
  withAudio?: boolean;
  motionStrength?: number;
  /** End-frame for first-and-last-frame interpolation models */
  endImageUrl?: string;
}

export interface VideoResult {
  url: string;
  provider: VideoProviderId;
  costUSD: number;
  latencyMs: number;
  durationSec: number;
  width: number;
  height: number;
  hasAudio: boolean;
  raw?: unknown;
}

export type VideoProviderId =
  | "runway_gen4"
  | "openai_sora2"
  | "google_veo3"
  | "luma_ray2"
  | "kling_v21"
  | "pika_v22"
  | "minimax_hailuo02"
  | "bytedance_seedance"
  | "alibaba_wan25"
  | "replicate"
  | "fal"
  | "hunyuan_self"
  | "ltx_self"
  | "mochi_self"
  | "cogvideo_self"
  | "open_sora_self"
  | "svd_self"
  | "animatediff_self";

export interface VideoProvider {
  id: VideoProviderId;
  enabled(): boolean;
  /** Returns dollars for the requested clip */
  estCost(spec: VideoSpec): number;
  generate(spec: VideoSpec): Promise<VideoResult>;
}
