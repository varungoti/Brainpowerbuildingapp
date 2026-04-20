export interface ImageSpec {
  prompt: string;
  negativePrompt?: string;
  /** w/h, e.g. "9:16", "16:9", "1:1", "3:2" */
  aspect?: string;
  /** target longest edge, default 1024 */
  size?: number;
  /** seed for reproducibility */
  seed?: number;
  /** brand reference image URL (used by IPAdapter / FaceID-capable providers) */
  refImageUrl?: string;
  /** style tag handed to providers that accept it (e.g. "photoreal", "vector") */
  style?: string;
  /** "high" forces brand-consistent self-hosted; "low" allows hosted */
  brandConsistency?: "high" | "low";
  /** if true, prefer providers known for legible text in image */
  textInImage?: boolean;
}

export interface ImageResult {
  url: string;
  provider: ProviderId;
  costUSD: number;
  latencyMs: number;
  width: number;
  height: number;
  seed?: number;
  raw?: unknown;
}

export type ProviderId =
  | "ideogram"
  | "flux_pro"
  | "flux_schnell_self"
  | "recraft"
  | "leonardo"
  | "stability_sd35"
  | "google_imagen4"
  | "midjourney"
  | "openai_gpt_image"
  | "replicate"
  | "fal"
  | "together"
  | "sdxl_self"
  | "comfy_self"
  | "pexels"
  | "unsplash"
  | "pixabay";

export interface Provider {
  id: ProviderId;
  enabled(): boolean;
  /** dollars per image at default settings (used for cost preview) */
  estCost(spec: ImageSpec): number;
  generate(spec: ImageSpec): Promise<ImageResult>;
}
