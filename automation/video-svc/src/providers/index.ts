import type { VideoProvider, VideoProviderId } from "../types.js";
import {
  alibabaWan25,
  bytedanceSeedance,
  falVideo,
  googleVeo3,
  klingV21,
  lumaRay2,
  minimaxHailuo02,
  openaiSora2,
  pikaV22,
  replicateVideo,
  runwayGen4,
} from "./hosted.js";
import {
  animateDiffSelf,
  cogVideoSelf,
  hunyuanSelf,
  ltxSelf,
  mochiSelf,
  openSoraSelf,
  svdSelf,
} from "./selfHosted.js";

export const ALL_VIDEO_PROVIDERS: VideoProvider[] = [
  runwayGen4,
  openaiSora2,
  googleVeo3,
  lumaRay2,
  klingV21,
  pikaV22,
  minimaxHailuo02,
  bytedanceSeedance,
  alibabaWan25,
  replicateVideo,
  falVideo,
  hunyuanSelf,
  ltxSelf,
  mochiSelf,
  cogVideoSelf,
  openSoraSelf,
  svdSelf,
  animateDiffSelf,
];

const map = new Map<VideoProviderId, VideoProvider>(
  ALL_VIDEO_PROVIDERS.map((p) => [p.id, p]),
);

export function getVideoProvider(id: VideoProviderId): VideoProvider | undefined {
  return map.get(id);
}

export function enabledVideoProviders(): VideoProvider[] {
  return ALL_VIDEO_PROVIDERS.filter((p) => p.enabled());
}

export function routeVideoProvider(opts: {
  withAudio?: boolean;
  preferCheap?: boolean;
  preferOpen?: boolean;
}): VideoProvider {
  const enabled = enabledVideoProviders();
  if (enabled.length === 0) throw new Error("No video providers configured");
  const pick = (id: VideoProviderId) => enabled.find((p) => p.id === id);
  if (opts.withAudio) {
    return pick("openai_sora2") ?? pick("google_veo3") ?? enabled[0];
  }
  if (opts.preferOpen) {
    return (
      pick("hunyuan_self") ??
      pick("open_sora_self") ??
      pick("ltx_self") ??
      pick("mochi_self") ??
      pick("cogvideo_self") ??
      enabled[0]
    );
  }
  if (opts.preferCheap) {
    return pick("minimax_hailuo02") ?? pick("alibaba_wan25") ?? pick("kling_v21") ?? enabled[0];
  }
  return (
    pick(process.env.DEFAULT_PROVIDER as VideoProviderId) ??
    pick("runway_gen4") ??
    pick("luma_ray2") ??
    enabled[0]
  );
}
