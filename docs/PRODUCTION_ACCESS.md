# Production Access Checklist (110% Readiness)

This file is the single source of truth for every credential, MCP, secret, and key
required to run NeuroSpark in production across all five tracks (consumer app,
admin backend, n8n marketing automation, marketing site, and AI video studio).

Treat this like a runbook: tick each row as you provision the secret. **Never
commit values to git** — only commit the `*.env.example` shells alongside this
document.

---

## 1. MCPs (already wired in this workspace)

| MCP server | Used by | Status |
| --- | --- | --- |
| `user-supabase` | Migrations, RLS, table introspection, seed data | wired |
| `user-railway` | Deploy n8n, admin app, edge workers, Kokoro, image-svc | wired |
| `user-Neon` | Analytics warehouse + n8n backing store | wired |
| `cursor-ide-browser` | E2E smoke checks during deploys | wired |
| `plugin-tavily-tavily` | Real-time web research from automation flows | wired |

> If any MCP shows an `mcp_auth` tool, run it before invoking other tools on
> that server. See `mcps/<server>/tools/` for the schema.

---

## 2. Provider credentials

### 2.1 Core platform

| Secret | Where it lives | Consumed by |
| --- | --- | --- |
| `OPENAI_API_KEY` | Supabase Edge env, n8n, Studio orchestrator | Coach, AI Counselor, Narrative, script generation |
| `ANTHROPIC_API_KEY` *(fallback)* | Same as above | LLM fallback when OpenAI rate-limits |
| `SUPABASE_URL` | All apps (`VITE_SUPABASE_URL`) | client + server SDKs |
| `SUPABASE_ANON_KEY` | All client apps (`VITE_SUPABASE_ANON_KEY`) | RLS-scoped client access |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge env, admin app build env, n8n DB nodes, Studio orchestrator | server-only |
| `RESEND_API_KEY` + `RESEND_FROM` | Supabase env + n8n | Weekly report email, drip campaigns |
| `SENTRY_DSN` | `VITE_SENTRY_DSN` (already wired) | Error capture |
| `POSTHOG_PROJECT_API_KEY` + `POSTHOG_HOST` | `VITE_POSTHOG_KEY` + n8n | Product + marketing attribution |

### 2.2 Admin & analytics

| Secret | Where | Consumed by |
| --- | --- | --- |
| `NEON_DATABASE_URL` | GitHub Actions secret, admin env, Studio queue | Nightly ETL, admin "heavy" queries, BullMQ alt |
| `ADMIN_JWT_SECRET` | Edge env | Signs short-lived admin impersonation tokens |
| `RAILWAY_TOKEN` | CI + local deploy | `railway up` from CI |
| `GITHUB_PAT` *(repo + workflow scope)* | provided to assistant directly | PRs, branch protection, Actions, n8n GitHub node |

### 2.3 Mobile / store

| Secret | Where | Consumed by |
| --- | --- | --- |
| Apple ASC API key (`AuthKey_*.p8`, key id, issuer id) | n8n credentials | App Store Connect listing automation, reviews fetch |
| Google Play service-account JSON | n8n credentials | Play Console listing + reviews fetch |
| `FIREBASE_CONFIG` *(future)* | n8n + future Edge Function | Remote push |

### 2.4 Video studio (Track 5) — image providers

The studio routes per-scene to whichever provider best fits the scene.
You only need to configure the providers you want to use — the orchestrator
gracefully degrades and only surfaces enabled providers in the admin UI.

| Provider | Env var | Best for | Pricing (Apr 2026) |
| --- | --- | --- | --- |
| Ideogram v3 | `IDEOGRAM_API_KEY` | Text-in-image, title cards, posters | $0.06/image |
| FLUX.1.1 Pro Ultra | `BFL_API_KEY` | Photoreal hero shots, 4MP | $0.06/image |
| FLUX.1 schnell *(self-hosted opt.)* | `FLUX_SCHNELL_URL` | Cheap drafts | self-hosted GPU |
| Recraft V3 | `RECRAFT_API_KEY` | Vector / illustrative / brand-styled | $0.04/image |
| OpenAI gpt-image-1 (DALL·E 4) | `OPENAI_API_KEY` (reused) | Illustrations, infographics | $0.04-0.17/image |
| Google Imagen 4 Ultra | `GOOGLE_GENAI_API_KEY` | Photoreal, multilingual text | $0.06/image |
| Stability SD 3.5 Large | `STABILITY_API_KEY` | Cheap photoreal fallback | $0.065/image |
| Leonardo.ai Phoenix 1.0 | `LEONARDO_API_KEY` | Game-art / illustration | $0.02-0.06/image |
| Midjourney *(via 3rd-party API)* | `MIDJOURNEY_API_KEY` | Aesthetic mood frames | $0.10/image |
| Replicate | `REPLICATE_API_TOKEN` | Wildcard router (any model on Replicate) | usage-based |
| fal.ai | `FAL_KEY` | Fast inference (Flux, SDXL, etc.) | usage-based |
| Together.ai | `TOGETHER_API_KEY` | Cheap FLUX schnell hosting | usage-based |
| Self-hosted SDXL + IPAdapter-FaceID | `SDXL_URL` + `SDXL_TOKEN` | Brand-character consistency | self-hosted GPU |
| Self-hosted ComfyUI workflow runner | `COMFY_URL` + `COMFY_TOKEN` | Custom node graphs | self-hosted GPU |
| Pexels Photos API | `PEXELS_API_KEY` | Stock fallback | free |
| Unsplash API | `UNSPLASH_ACCESS_KEY` | Stock fallback | free |
| Pixabay API | `PIXABAY_API_KEY` | Stock fallback | free |

### 2.5 Video studio (Track 5) — voice providers

| Provider | Env var | Notes |
| --- | --- | --- |
| **Kokoro-FastAPI** *(self-hosted, default)* | `KOKORO_URL` + `KOKORO_TOKEN` | Per-word timestamps, OpenAI-compatible |
| OpenAI TTS-1-HD *(fallback)* | `OPENAI_API_KEY` | $0.030/1k chars |
| ElevenLabs v3 *(premium voiceover)* | `ELEVENLABS_API_KEY` | $0.30/1k chars Turbo, $0.50 Multi v3 |
| PlayHT 3.0 | `PLAYHT_API_KEY` + `PLAYHT_USER_ID` | Cheap conversational |
| Cartesia Sonic | `CARTESIA_API_KEY` | Lowest latency |
| Hume Octave 2 | `HUME_API_KEY` | Emotive |
| Resemble.ai | `RESEMBLE_API_KEY` + `RESEMBLE_PROJECT_UUID` | Voice cloning |

### 2.6 Video studio (Track 5) — video model providers

For full text-to-video / image-to-video coverage so the operator can A/B test
quality vs cost vs latency per project.

| Provider | Env var | Notes |
| --- | --- | --- |
| **Runway Gen-4 Turbo** | `RUNWAY_API_KEY` | Best motion fidelity |
| OpenAI Sora 2 Pro | `OPENAI_API_KEY` | Native audio + dialog |
| Google Veo 3 | `GOOGLE_GENAI_API_KEY` | 4K, native audio |
| Luma Ray 2 | `LUMA_API_KEY` | Cinematic, fast |
| Kling 2.1 Master | `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` | Best i2v at low cost |
| Pika 2.2 | `PIKA_API_KEY` | Quirky/stylized |
| MiniMax Hailuo 02 | `MINIMAX_API_KEY` | Cheap, decent quality |
| ByteDance Seedance 1.0 | `BYTEDANCE_API_KEY` | Pro-grade i2v |
| Alibaba Wan 2.5 | `WAN_API_KEY` | Open weights, hostable |
| Tencent Hunyuan Video | `HUNYUAN_API_KEY` | Open weights |
| Lightricks LTX Video 0.9 | `LTX_API_KEY` *(or self-hosted)* | Real-time draft |
| Genmo Mochi 1 | `MOCHI_URL` *(self-hosted)* | Open weights |
| Zhipu CogVideoX-5B | `COGVIDEO_URL` *(self-hosted)* | Open weights |
| HunyuanVideo / Open-Sora 2.0 | `OPEN_SORA_URL` *(self-hosted)* | Fully open |
| Stable Video Diffusion 1.1 | `SVD_URL` *(self-hosted)* | Image animation |
| AnimateDiff Lightning | `ANIMATEDIFF_URL` *(self-hosted)* | Cheap motion priors |
| **Replicate / fal.ai routing** | reuse keys | Wildcard for any of the above |

### 2.7 Distribution & growth (n8n + Postiz)

**As of April 2026, Postiz is the primary distribution layer.** Buffer is kept
as a fallback toggle (`USE_POSTIZ=false`) for emergency cutover only. See
`docs/POSTIZ_EVALUATION.md` for the full rationale.

| Secret | Where | Consumed by |
| --- | --- | --- |
| **`POSTIZ_BASE_URL`** | n8n env, Studio orchestrator, admin server | Postiz REST endpoint (`http://postiz-api:3000` in Compose, Railway URL in prod) |
| **`POSTIZ_FRONTEND_URL`** | admin app (`VITE_POSTIZ_FRONTEND_URL`) | Embedded iframe + "open in new tab" |
| **`POSTIZ_API_KEY`** | n8n env, Studio orchestrator, admin server | Postiz REST authentication (server-side only) |
| **`POSTIZ_CHANNEL_*`** *(15 vars — IG, TIKTOK, YOUTUBE, X, LINKEDIN, BLUESKY, THREADS, MASTODON, REDDIT, PINTEREST, MEDIUM, DEVTO, HASHNODE, TELEGRAM, DISCORD)* | n8n env | Per-platform integration UUIDs (copy from Postiz UI URL after connecting each channel) |
| `USE_POSTIZ` *(default `true`)* | n8n env | Feature flag — flip to `false` to fall back to Buffer |
| `BUFFER_ACCESS_TOKEN` *(legacy fallback)* | n8n credentials | Only used when `USE_POSTIZ=false` |
| `META_GRAPH_API_TOKEN` + `META_AD_ACCOUNT_ID` | n8n | Ad creative gen |
| `GOOGLE_ADS_DEVELOPER_TOKEN` + OAuth refresh | n8n | Ad creative gen |
| `LINKEDIN_ACCESS_TOKEN` *(legacy fallback)* | n8n | Direct API — Postiz handles this natively now |
| `MEDIUM_INTEGRATION_TOKEN` *(legacy fallback)* | n8n | Direct API — Postiz handles this natively now |
| `DEVTO_API_KEY` *(legacy fallback)* | n8n | Direct API — Postiz handles this natively now |
| `SUBSTACK_SESSION_COOKIE` | n8n | Distributor (Postiz lacks Substack support as of Apr 2026) |
| `TWITTER_BEARER_TOKEN` + OAuth | n8n | Community signal monitor (read-only, separate from Postiz publish) |
| `BLUESKY_APP_PASSWORD` *(legacy fallback)* | n8n | Direct API — Postiz handles this natively now |
| `REDDIT_CLIENT_ID` + secret | n8n | Reddit listener (read-only) |
| `AHREFS_API_TOKEN` *(or DataForSEO)* | n8n | SEO blog engine |
| `OPUS_CLIP_API_KEY` *(or `VIZARD_API_KEY`)* | n8n | YouTube auto-clipper |
| `APIFY_TOKEN` | n8n | Influencer scraping |
| `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` | n8n | Approval gates |

---

## 3. Provisioning order

1. Provision Supabase project (already done) → set `SUPABASE_*` everywhere.
2. Provision Neon project → `NEON_DATABASE_URL`.
3. Provision Railway project → `RAILWAY_TOKEN`. Then deploy:
   - `studio/server` (Remotion orchestrator + headless Chromium)
   - `automation/image-svc`
   - `automation/video-svc`
   - `automation/voice-svc-kokoro`
   - `automation/n8n`
   - `automation/postiz` (social distribution layer — see `automation/postiz/README.md`)
     1. Deploy Postiz to Railway via the included `Dockerfile` + `railway.json`.
     2. Open the Postiz UI, sign up, generate an API key under **Settings → API**.
     3. Connect each social channel (Settings → Channels) and copy each
        integration UUID from the URL into the matching `POSTIZ_CHANNEL_*` env var.
     4. Set `POSTIZ_BASE_URL`, `POSTIZ_API_KEY`, and (for the admin app)
        `VITE_POSTIZ_FRONTEND_URL`.
     5. To embed Postiz in the admin iframe, configure your reverse proxy with
        a permissive `frame-ancestors` CSP — examples in `automation/postiz/README.md`.
4. Configure GitHub repository → branch protection, Actions secrets.
5. Add provider keys (start with the bare minimum: OPENAI, IDEOGRAM, KOKORO, RESEND, POSTHOG, SENTRY).
6. Run the smoke deck: `pnpm verify` on root, `pnpm test` in `/admin`, `/studio`, `/marketing-site`.

---

## 4. Per-app environment shells

| Path | Purpose |
| --- | --- |
| `.env.example` *(root)* | Consumer Vite app (already exists) |
| `admin/.env.example` | Admin Vite app |
| `studio/.env.example` | Remotion studio + orchestrator |
| `marketing-site/.env.example` | Astro marketing site |
| `automation/n8n/.env.example` | Self-hosted n8n |
| `automation/image-svc/.env.example` | Image router service |
| `automation/video-svc/.env.example` | Video model router service |
| `automation/voice-svc-kokoro/.env.example` | Kokoro auth proxy |
| `etl/.env.example` | dbt + ETL job env |

---

## 5. Cost ceilings (enforced by code)

The Studio orchestrator and n8n workflows refuse new jobs once these monthly
caps are exceeded. Override in env:

| Env var | Default |
| --- | --- |
| `STUDIO_MONTHLY_USD_CAP` | `100` |
| `IMAGE_SVC_MONTHLY_USD_CAP` | `60` |
| `VIDEO_SVC_MONTHLY_USD_CAP` | `120` |
| `VOICE_SVC_MONTHLY_USD_CAP` | `20` |
| `N8N_MARKETING_MONTHLY_USD_CAP` | `200` |

Cost ledger lives in Postgres table `studio_cost_ledger` (created by the
Studio migration in Track 5).
