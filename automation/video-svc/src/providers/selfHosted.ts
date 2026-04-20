import type { VideoProvider, VideoResult, VideoSpec } from "../types.js";

/**
 * Self-hosted open-weights video models. Each one expects a thin sidecar
 * with the same shape:
 *
 *   POST {SVC}/generate
 *     { prompt, image_url?, end_image_url?, duration, fps, width, height, seed }
 *   -> 200 { video_url, width, height, duration }
 *
 * We use this convention so adding a new model means: deploy a small sidecar
 * (e.g. via Replicate cog or a fastapi wrapper) and set the *_URL env var.
 */

interface SelfCfg {
  id: VideoProvider["id"];
  urlEnv: string;
  tokenEnv?: string;
  defaultDuration: number;
}

function dimsForAspect(aspect: string | undefined, res: string | undefined): [number, number] {
  const r = res ?? "720p";
  const base = r === "1080p" ? 1080 : r === "720p" ? 720 : 480;
  switch (aspect) {
    case "9:16":
      return [Math.round((base * 9) / 16), base];
    case "1:1":
      return [base, base];
    case "16:9":
    default:
      return [Math.round((base * 16) / 9), base];
  }
}

function makeSelfHosted(cfg: SelfCfg): VideoProvider {
  return {
    id: cfg.id,
    enabled: () => Boolean(process.env[cfg.urlEnv]),
    estCost: () => 0,
    async generate(spec: VideoSpec): Promise<VideoResult> {
      const url = process.env[cfg.urlEnv];
      if (!url) throw new Error(`${cfg.urlEnv} not set`);
      const tok = cfg.tokenEnv ? process.env[cfg.tokenEnv] : undefined;
      const t0 = Date.now();
      const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
      const res = await fetch(`${url}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
        },
        body: JSON.stringify({
          prompt: spec.prompt,
          image_url: spec.imageUrl,
          end_image_url: spec.endImageUrl,
          duration: spec.durationSec ?? cfg.defaultDuration,
          fps: spec.fps ?? 24,
          width: w,
          height: h,
          seed: spec.seed,
          motion_strength: spec.motionStrength,
        }),
      });
      if (!res.ok) throw new Error(`${cfg.id} ${res.status}: ${await res.text()}`);
      const j = (await res.json()) as {
        video_url: string;
        width: number;
        height: number;
        duration: number;
      };
      return {
        url: j.video_url,
        provider: cfg.id,
        costUSD: 0,
        latencyMs: Date.now() - t0,
        durationSec: j.duration,
        width: j.width,
        height: j.height,
        hasAudio: false,
      };
    },
  };
}

export const hunyuanSelf = makeSelfHosted({
  id: "hunyuan_self",
  urlEnv: "HUNYUAN_URL",
  tokenEnv: "HUNYUAN_TOKEN",
  defaultDuration: 5,
});

export const ltxSelf = makeSelfHosted({
  id: "ltx_self",
  urlEnv: "LTX_URL",
  tokenEnv: "LTX_TOKEN",
  defaultDuration: 5,
});

export const mochiSelf = makeSelfHosted({
  id: "mochi_self",
  urlEnv: "MOCHI_URL",
  tokenEnv: "MOCHI_TOKEN",
  defaultDuration: 5,
});

export const cogVideoSelf = makeSelfHosted({
  id: "cogvideo_self",
  urlEnv: "COGVIDEO_URL",
  tokenEnv: "COGVIDEO_TOKEN",
  defaultDuration: 6,
});

export const openSoraSelf = makeSelfHosted({
  id: "open_sora_self",
  urlEnv: "OPEN_SORA_URL",
  tokenEnv: "OPEN_SORA_TOKEN",
  defaultDuration: 8,
});

export const svdSelf = makeSelfHosted({
  id: "svd_self",
  urlEnv: "SVD_URL",
  tokenEnv: "SVD_TOKEN",
  defaultDuration: 4,
});

export const animateDiffSelf = makeSelfHosted({
  id: "animatediff_self",
  urlEnv: "ANIMATEDIFF_URL",
  tokenEnv: "ANIMATEDIFF_TOKEN",
  defaultDuration: 3,
});
