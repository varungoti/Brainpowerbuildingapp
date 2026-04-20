import type { VideoProvider, VideoResult, VideoSpec } from "../types.js";

function dimsForAspect(aspect: string | undefined, res: string | undefined): [number, number] {
  const r = res ?? "1080p";
  const base = r === "4k" ? 2160 : r === "1080p" ? 1080 : r === "720p" ? 720 : 480;
  switch (aspect) {
    case "9:16":
      return [Math.round((base * 9) / 16), base];
    case "1:1":
      return [base, base];
    case "4:3":
      return [Math.round((base * 4) / 3), base];
    case "16:9":
    default:
      return [Math.round((base * 16) / 9), base];
  }
}

async function pollForUrl(
  pollFn: () => Promise<{ done: boolean; url?: string; failed?: boolean; reason?: string }>,
  opts: { intervalMs?: number; timeoutMs?: number; tag: string },
): Promise<string> {
  const interval = opts.intervalMs ?? 4000;
  const timeout = opts.timeoutMs ?? 5 * 60_000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const r = await pollFn();
    if (r.failed) throw new Error(`${opts.tag} failed: ${r.reason ?? "unknown"}`);
    if (r.done && r.url) return r.url;
    await new Promise((res) => setTimeout(res, interval));
  }
  throw new Error(`${opts.tag} timed out after ${timeout}ms`);
}

// ---------- Runway Gen-4 / Gen-4 Turbo ----------
export const runwayGen4: VideoProvider = {
  id: "runway_gen4",
  enabled: () => Boolean(process.env.RUNWAY_API_KEY),
  estCost: (spec) => 0.05 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.RUNWAY_API_KEY!;
    const t0 = Date.now();
    const ratio = spec.aspect === "9:16" ? "720:1280" : "1280:720";
    const create = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4_turbo",
        promptImage: spec.imageUrl,
        promptText: spec.prompt,
        ratio,
        duration: spec.durationSec ?? 5,
        seed: spec.seed,
      }),
    });
    if (!create.ok) throw new Error(`Runway ${create.status}: ${await create.text()}`);
    const { id } = (await create.json()) as { id: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${id}`, {
          headers: { Authorization: `Bearer ${KEY}`, "X-Runway-Version": "2024-11-06" },
        });
        const j = (await r.json()) as { status: string; output?: string[] };
        return {
          done: j.status === "SUCCEEDED",
          failed: j.status === "FAILED",
          url: j.output?.[0],
        };
      },
      { tag: "runway" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "runway_gen4",
      costUSD: runwayGen4.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- OpenAI Sora 2 / Sora 2 Pro ----------
export const openaiSora2: VideoProvider = {
  id: "openai_sora2",
  enabled: () => Boolean(process.env.OPENAI_API_KEY),
  estCost: (spec) => 0.1 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.OPENAI_API_KEY!;
    const t0 = Date.now();
    const create = await fetch("https://api.openai.com/v1/videos", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: spec.resolution === "4k" ? "sora-2-pro" : "sora-2",
        prompt: spec.prompt,
        seconds: String(spec.durationSec ?? 8),
        size: spec.aspect === "9:16" ? "720x1280" : "1280x720",
      }),
    });
    if (!create.ok) throw new Error(`Sora ${create.status}: ${await create.text()}`);
    const { id } = (await create.json()) as { id: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(`https://api.openai.com/v1/videos/${id}`, {
          headers: { Authorization: `Bearer ${KEY}` },
        });
        const j = (await r.json()) as { status: string; output?: { url: string } };
        return {
          done: j.status === "completed",
          failed: j.status === "failed",
          url: j.output?.url,
        };
      },
      { tag: "sora", intervalMs: 5000, timeoutMs: 10 * 60_000 },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "openai_sora2",
      costUSD: openaiSora2.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 8,
      width: w,
      height: h,
      hasAudio: spec.withAudio !== false,
    };
  },
};

// ---------- Google Veo 3 ----------
export const googleVeo3: VideoProvider = {
  id: "google_veo3",
  enabled: () => Boolean(process.env.GOOGLE_GENAI_API_KEY),
  estCost: (spec) => 0.1 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.GOOGLE_GENAI_API_KEY!;
    const t0 = Date.now();
    const create = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: spec.prompt, image: spec.imageUrl }],
          parameters: {
            aspectRatio: spec.aspect === "9:16" ? "9:16" : "16:9",
            durationSeconds: spec.durationSec ?? 8,
            generateAudio: spec.withAudio !== false,
          },
        }),
      },
    );
    if (!create.ok) throw new Error(`Veo3 ${create.status}: ${await create.text()}`);
    const { name } = (await create.json()) as { name: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${name}?key=${KEY}`,
        );
        const j = (await r.json()) as {
          done: boolean;
          response?: { generateVideoResponse?: { generatedSamples: Array<{ video: { uri: string } }> } };
          error?: { message: string };
        };
        return {
          done: j.done && !!j.response?.generateVideoResponse?.generatedSamples?.[0],
          failed: !!j.error,
          reason: j.error?.message,
          url: j.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri,
        };
      },
      { tag: "veo3", timeoutMs: 10 * 60_000 },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "google_veo3",
      costUSD: googleVeo3.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 8,
      width: w,
      height: h,
      hasAudio: spec.withAudio !== false,
    };
  },
};

// ---------- Luma Ray 2 ----------
export const lumaRay2: VideoProvider = {
  id: "luma_ray2",
  enabled: () => Boolean(process.env.LUMA_API_KEY),
  estCost: (spec) => 0.04 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.LUMA_API_KEY!;
    const t0 = Date.now();
    const create = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/video", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ray-2",
        prompt: spec.prompt,
        aspect_ratio: spec.aspect ?? "16:9",
        duration: `${spec.durationSec ?? 5}s`,
        loop: false,
        keyframes: spec.imageUrl
          ? { frame0: { type: "image", url: spec.imageUrl } }
          : undefined,
      }),
    });
    if (!create.ok) throw new Error(`Luma ${create.status}: ${await create.text()}`);
    const { id } = (await create.json()) as { id: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${id}`, {
          headers: { Authorization: `Bearer ${KEY}` },
        });
        const j = (await r.json()) as { state: string; assets?: { video?: string } };
        return {
          done: j.state === "completed",
          failed: j.state === "failed",
          url: j.assets?.video,
        };
      },
      { tag: "luma" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "luma_ray2",
      costUSD: lumaRay2.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- Kling 2.1 Master (Kuaishou) ----------
export const klingV21: VideoProvider = {
  id: "kling_v21",
  enabled: () =>
    Boolean(process.env.KLING_ACCESS_KEY) && Boolean(process.env.KLING_SECRET_KEY),
  estCost: (spec) => 0.03 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    // Kling uses JWT auth signed from access+secret keys.
    // For brevity we expect KLING_JWT to be supplied; if not, sign here.
    const JWT = process.env.KLING_JWT ?? "";
    if (!JWT) throw new Error("KLING_JWT not set; use Kling SDK to mint a token");
    const t0 = Date.now();
    const endpoint = spec.imageUrl
      ? "https://api.klingai.com/v1/videos/image2video"
      : "https://api.klingai.com/v1/videos/text2video";
    const create = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: "kling-v2-1-master",
        prompt: spec.prompt,
        image: spec.imageUrl,
        aspect_ratio: spec.aspect ?? "16:9",
        duration: String(spec.durationSec ?? 5),
        mode: "pro",
      }),
    });
    if (!create.ok) throw new Error(`Kling ${create.status}: ${await create.text()}`);
    const { data } = (await create.json()) as { data: { task_id: string } };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(`https://api.klingai.com/v1/videos/text2video/${data.task_id}`, {
          headers: { Authorization: `Bearer ${JWT}` },
        });
        const j = (await r.json()) as {
          data: { task_status: string; task_result?: { videos: Array<{ url: string }> } };
        };
        return {
          done: j.data.task_status === "succeed",
          failed: j.data.task_status === "failed",
          url: j.data.task_result?.videos?.[0]?.url,
        };
      },
      { tag: "kling" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "kling_v21",
      costUSD: klingV21.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- Pika 2.2 ----------
export const pikaV22: VideoProvider = {
  id: "pika_v22",
  enabled: () => Boolean(process.env.PIKA_API_KEY),
  estCost: (spec) => 0.045 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.PIKA_API_KEY!;
    const t0 = Date.now();
    const create = await fetch("https://api.pika.art/generate/2.2/i2v", {
      method: "POST",
      headers: { "X-API-KEY": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        promptText: spec.prompt,
        image: spec.imageUrl,
        seed: spec.seed,
        aspectRatio: spec.aspect ?? "16:9",
        duration: spec.durationSec ?? 5,
      }),
    });
    if (!create.ok) throw new Error(`Pika ${create.status}: ${await create.text()}`);
    const { video_id } = (await create.json()) as { video_id: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(`https://api.pika.art/videos/${video_id}`, {
          headers: { "X-API-KEY": KEY },
        });
        const j = (await r.json()) as { status: string; url?: string };
        return { done: j.status === "finished", failed: j.status === "failed", url: j.url };
      },
      { tag: "pika" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "pika_v22",
      costUSD: pikaV22.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- MiniMax Hailuo 02 ----------
export const minimaxHailuo02: VideoProvider = {
  id: "minimax_hailuo02",
  enabled: () => Boolean(process.env.MINIMAX_API_KEY),
  estCost: (spec) => 0.02 * (spec.durationSec ?? 6),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.MINIMAX_API_KEY!;
    const t0 = Date.now();
    const create = await fetch("https://api.minimaxi.chat/v1/video_generation", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "MiniMax-Hailuo-02",
        prompt: spec.prompt,
        first_frame_image: spec.imageUrl,
        duration: spec.durationSec ?? 6,
        resolution: spec.resolution === "1080p" ? "1080P" : "768P",
      }),
    });
    if (!create.ok) throw new Error(`Hailuo ${create.status}: ${await create.text()}`);
    const { task_id } = (await create.json()) as { task_id: string };
    const fileUrl = await pollForUrl(
      async () => {
        const r = await fetch(
          `https://api.minimaxi.chat/v1/query/video_generation?task_id=${task_id}`,
          { headers: { Authorization: `Bearer ${KEY}` } },
        );
        const j = (await r.json()) as { status: string; file_id?: string };
        if (j.status === "Success" && j.file_id) {
          const f = await fetch(`https://api.minimaxi.chat/v1/files/retrieve?file_id=${j.file_id}`, {
            headers: { Authorization: `Bearer ${KEY}` },
          });
          const fj = (await f.json()) as { file?: { download_url: string } };
          return { done: true, url: fj.file?.download_url };
        }
        if (j.status === "Fail") return { done: false, failed: true };
        return { done: false };
      },
      { tag: "hailuo" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url: fileUrl,
      provider: "minimax_hailuo02",
      costUSD: minimaxHailuo02.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 6,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- ByteDance Seedance 1.0 Pro ----------
export const bytedanceSeedance: VideoProvider = {
  id: "bytedance_seedance",
  enabled: () => Boolean(process.env.BYTEDANCE_API_KEY),
  estCost: (spec) => 0.06 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.BYTEDANCE_API_KEY!;
    const t0 = Date.now();
    const create = await fetch("https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "doubao-seedance-1-0-pro-250528",
        content: [
          { type: "text", text: spec.prompt },
          ...(spec.imageUrl ? [{ type: "image_url", image_url: { url: spec.imageUrl } }] : []),
        ],
      }),
    });
    if (!create.ok) throw new Error(`Seedance ${create.status}: ${await create.text()}`);
    const { id } = (await create.json()) as { id: string };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(
          `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${id}`,
          { headers: { Authorization: `Bearer ${KEY}` } },
        );
        const j = (await r.json()) as { status: string; content?: { video_url: string } };
        return {
          done: j.status === "succeeded",
          failed: j.status === "failed",
          url: j.content?.video_url,
        };
      },
      { tag: "seedance" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "bytedance_seedance",
      costUSD: bytedanceSeedance.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- Alibaba Wan 2.5 ----------
export const alibabaWan25: VideoProvider = {
  id: "alibaba_wan25",
  enabled: () => Boolean(process.env.WAN_API_KEY),
  estCost: (spec) => 0.025 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.WAN_API_KEY!;
    const t0 = Date.now();
    const create = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify({
          model: "wan2.5-t2v-plus",
          input: { prompt: spec.prompt, img_url: spec.imageUrl },
          parameters: {
            size: spec.aspect === "9:16" ? "720*1280" : "1280*720",
            duration: spec.durationSec ?? 5,
          },
        }),
      },
    );
    if (!create.ok) throw new Error(`Wan ${create.status}: ${await create.text()}`);
    const { output } = (await create.json()) as { output: { task_id: string } };
    const url = await pollForUrl(
      async () => {
        const r = await fetch(
          `https://dashscope.aliyuncs.com/api/v1/tasks/${output.task_id}`,
          { headers: { Authorization: `Bearer ${KEY}` } },
        );
        const j = (await r.json()) as {
          output: { task_status: string; video_url?: string };
        };
        return {
          done: j.output.task_status === "SUCCEEDED",
          failed: j.output.task_status === "FAILED",
          url: j.output.video_url,
        };
      },
      { tag: "wan" },
    );
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "alibaba_wan25",
      costUSD: alibabaWan25.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- Replicate wildcard ----------
export const replicateVideo: VideoProvider = {
  id: "replicate",
  enabled: () => Boolean(process.env.REPLICATE_API_TOKEN),
  estCost: (spec) => 0.02 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.REPLICATE_API_TOKEN!;
    const t0 = Date.now();
    const model = spec.style?.startsWith("replicate:")
      ? spec.style.slice("replicate:".length)
      : "minimax/video-01";
    const create = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "wait=120",
      },
      body: JSON.stringify({
        input: {
          prompt: spec.prompt,
          first_frame_image: spec.imageUrl,
          aspect_ratio: spec.aspect ?? "16:9",
          duration: spec.durationSec ?? 5,
        },
      }),
    });
    if (!create.ok) throw new Error(`Replicate video ${create.status}: ${await create.text()}`);
    const j = (await create.json()) as { output: string | string[]; status: string };
    const url = Array.isArray(j.output) ? j.output[0] : j.output;
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url,
      provider: "replicate",
      costUSD: replicateVideo.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};

// ---------- fal.ai wildcard ----------
export const falVideo: VideoProvider = {
  id: "fal",
  enabled: () => Boolean(process.env.FAL_KEY),
  estCost: (spec) => 0.02 * (spec.durationSec ?? 5),
  async generate(spec): Promise<VideoResult> {
    const KEY = process.env.FAL_KEY!;
    const t0 = Date.now();
    const model = spec.style?.startsWith("fal:") ? spec.style.slice(4) : "fal-ai/kling-video/v2.1/master/text-to-video";
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        image_url: spec.imageUrl,
        duration: String(spec.durationSec ?? 5),
        aspect_ratio: spec.aspect ?? "16:9",
      }),
    });
    if (!res.ok) throw new Error(`fal video ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { video: { url: string } };
    const [w, h] = dimsForAspect(spec.aspect, spec.resolution);
    return {
      url: j.video.url,
      provider: "fal",
      costUSD: falVideo.estCost(spec),
      latencyMs: Date.now() - t0,
      durationSec: spec.durationSec ?? 5,
      width: w,
      height: h,
      hasAudio: false,
    };
  },
};
