# video-svc

Single endpoint that fans out to **18 video-generation providers** (hosted +
self-hosted). Studio orchestrator can route per-scene to optimize for quality,
cost, latency, audio support, or open-weights preference.

## Providers

| ID | Provider | Best for | Cost (5s clip, Apr 2026) |
| --- | --- | --- | --- |
| `runway_gen4` | Runway Gen-4 Turbo | best motion fidelity | $0.25 |
| `openai_sora2` | Sora 2 / Sora 2 Pro | native audio + dialog | $0.50 |
| `google_veo3` | Veo 3 | 4K, native audio | $0.50 |
| `luma_ray2` | Luma Ray 2 | cinematic, fast | $0.20 |
| `kling_v21` | Kling 2.1 Master | best i2v at low cost | $0.15 |
| `pika_v22` | Pika 2.2 | quirky/stylized | $0.225 |
| `minimax_hailuo02` | MiniMax Hailuo 02 | cheap photoreal | $0.12 |
| `bytedance_seedance` | Seedance 1.0 Pro | pro-grade i2v | $0.30 |
| `alibaba_wan25` | Wan 2.5 | open weights, hostable | $0.125 |
| `replicate` | wildcard router | any model on Replicate | usage |
| `fal` | wildcard router | fast inference | usage |
| `hunyuan_self` | Tencent HunyuanVideo | open weights | $0 |
| `ltx_self` | Lightricks LTX 0.9 | real-time draft | $0 |
| `mochi_self` | Genmo Mochi 1 | open weights | $0 |
| `cogvideo_self` | Zhipu CogVideoX-5B | open weights | $0 |
| `open_sora_self` | Open-Sora 2.0 | fully open | $0 |
| `svd_self` | Stable Video Diffusion 1.1 | image animation | $0 |
| `animatediff_self` | AnimateDiff Lightning | cheap motion priors | $0 |

## API

```bash
# generate one
curl -X POST $URL/v1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"spec":{"prompt":"...","durationSec":5,"aspect":"9:16","withAudio":true}}'

# A/B compare quality across providers
curl -X POST $URL/v1/compare \
  -d '{"spec":{"prompt":"..."},"providerIds":["runway_gen4","luma_ray2","kling_v21"]}'
```

## Smart routing

* `withAudio: true` → Sora 2 → Veo 3.
* `routing.preferOpen: true` → Hunyuan → Open-Sora → LTX → Mochi → CogVideoX.
* `routing.preferCheap: true` → Hailuo → Wan → Kling.
* default: `DEFAULT_PROVIDER` env, then Runway, then Luma.

## Self-hosted sidecar contract

All `*_self` providers expect a sidecar that exposes:

```
POST /generate
  { prompt, image_url?, end_image_url?, duration, fps, width, height, seed, motion_strength? }
-> 200 { video_url, width, height, duration }
```

This lets you wrap any HuggingFace model the same way (LTX, Mochi, CogVideoX,
Hunyuan, Open-Sora, SVD, AnimateDiff) — you drop a small fastapi container and
set the corresponding `*_URL` env var.
