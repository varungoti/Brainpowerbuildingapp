# Postiz evaluation — should we adopt it?

Repo: <https://github.com/gitroomhq/postiz-app> (28.9k★, AGPL-3.0, very active).
Docs: <https://docs.postiz.com>.

## Verdict: **YES, adopt as our distribution layer.** Replace Buffer + the per-platform Medium/Dev.to/Hashnode HTTP calls with a single Postiz instance.

We keep n8n as the **orchestration brain** and add Postiz as the **distribution arm**. Buffer remains a one-line fallback toggle (`USE_POSTIZ=false`) for the rare case Postiz auth breaks, but is no longer the default.

---

## Side-by-side scoring (our use case)

| Criterion | Buffer | Postiz (self-host) | Mixpost (self-host) |
| --- | --- | --- | --- |
| Recurring cost @ ~12 channels | ~$60–144/mo | $0 (Railway compute only) | $0 after one-off $299 |
| Channels we actually use today (TikTok, IG Reel, YT Shorts, X, LinkedIn, Bluesky, Threads, Mastodon, Reddit, Pinterest, Dev.to, Medium, Hashnode, Telegram, Discord, Slack) | 7/16 native, rest via Zapier | **15/16 native** (only Substack missing) | 11/16 native |
| API quality (rate limit, scheduling primitives, draft/approval flow) | mature | mature, REST + N8N node + MCP | mature REST |
| Self-host maturity | n/a | Docker, Compose, Helm chart, dev-container | Docker, Compose |
| AI native | basic | image **and** video gen baked in | text only |
| n8n integration | HTTP + buffer node | **first-party n8n node** | HTTP only |
| Agent-driven distribution | no | **MCP server** (Cursor / Claude / our own admin agents can drive it) | no |
| Maintenance/community | corporate, closed | 28.9k★ + active commits, weekly releases | 3.0k★, slower cadence |
| Licence implication for us | n/a (SaaS) | AGPL-3.0 — we **only call its API**, no AGPL obligation. We don't fork or redistribute Postiz binaries. | MIT — most permissive |

The only meaningful penalty is AGPL-3.0. Because we **consume Postiz over its public REST API** rather than embedding/redistributing source, our codebase remains under our chosen licence. (If we ever bundle Postiz source into a customer-facing product, we'd revisit.)

---

## What changes inside our stack

### Before (today)
```
n8n workflow ──► Buffer REST  ──► IG / TikTok / YT
n8n workflow ──► Medium API ──► Medium
n8n workflow ──► Dev.to API ──► Dev.to
n8n workflow ──► (manual)   ──► Hashnode / Bluesky / Threads
```

### After (with Postiz)
```
n8n workflow ──► POST /public/v1/posts (Postiz)
                     │
                     ├──► IG / TikTok / YT Shorts
                     ├──► Medium / Dev.to / Hashnode
                     ├──► X / LinkedIn / Threads / Bluesky / Mastodon
                     └──► Reddit / Pinterest / Telegram / Discord
```

One auth, one rate limit, one analytics surface, one agent surface (MCP).

---

## Frontend integration (admin panel)

The admin app now ships a **Social publishing** sidebar entry
(`admin/src/pages/social/SocialPage.tsx`) that:

- Pings `/admin/postiz/status` (server-side proxy that hides the API key) and shows a green / red / amber connection badge.
- Pulls a quick summary from `/admin/postiz/summary` — connected channel count, scheduled posts in next 7 days, active providers.
- Embeds the Postiz UI in an iframe with five quick tabs (Calendar, Compose, Channels, Analytics, Settings) deep-linked to the right Postiz routes.
- Falls back to **Open in new tab** if your reverse proxy denies framing (we document `Content-Security-Policy: frame-ancestors` config in `automation/postiz/README.md`).
- Exposes a `<PostizPublishButton>` on the **Studio job detail** page so a finished MP4 can be one-click published to selected Postiz channels.

The matching server endpoints live in `supabase/functions/server/admin.tsx`:

| Endpoint | Role | Purpose |
| --- | --- | --- |
| `GET /admin/postiz/status` | readonly | Health-check that surfaces "configured / unreachable / connected" |
| `GET /admin/postiz/summary` | marketing | Channel list + upcoming posts |
| `ANY /admin/postiz/proxy/*` | marketing | Generic API pass-through (audit-logged) |

`VITE_POSTIZ_FRONTEND_URL` is the only Postiz-related env var the admin app needs (the API key + base URL stay server-side).

## What we are shipping in this iteration

1. **`automation/postiz/`** — Docker Compose stack (Postiz + Postgres + Redis), Railway config, `.env.example`, README. Mirrors the `automation/n8n/` pattern.
2. **`automation/n8n/workflows/lib/postiz_publish.json`** — reusable sub-workflow that any other workflow can call to publish to N channels at once. Wraps the Postiz `/public/v1/posts` endpoint and handles the 30-req/hour rate limit.
3. **`automation/n8n/workflows/daily_shorts_factory.json`** — switched from Buffer multi-profile call to a single `Postiz` call that fans out to IG Reel + TikTok + YT Shorts + Threads + Bluesky.
4. **`automation/n8n/workflows/youtube_clipper.json`** — clip → Postiz (instead of clip → Buffer).
5. **`automation/n8n/workflows/seo_blog_engine.json`** — Postiz publishes to Medium + Dev.to + Hashnode in one call (replaces three separate API steps).
6. **`automation/postiz/lib/postizClient.ts`** — thin TypeScript helper our **Studio orchestrator** calls when `autoApprove + distribution[]` is set on a Studio job (so the admin can also trigger publishing without n8n).
7. **`PRODUCTION_ACCESS.md`** — credentials + provisioning steps for Postiz.
8. **`automation/n8n/.env.example`** — `POSTIZ_BASE_URL`, `POSTIZ_API_KEY`, channel-id env vars.
9. **`USE_POSTIZ` feature flag** — when `false`, workflows fall back to the original Buffer path.

---

## Cost / risk math

* Compute: Postiz fits in a $5/mo Railway service (1 vCPU / 512 MB) + a $1/mo Postgres + free Redis on Railway (or shared Neon). Total ≈ **$10/mo**.
* Buffer replacement saving at our launch fan-out: **$60–144/mo**.
* Net: **~$50–130/mo saved** plus 9 net-new channels we couldn't reach via Buffer.
* Risk: if Postiz instance is down, n8n workflow's `IF USE_POSTIZ` flag flips to Buffer. We monitor Postiz `/public/v1/integrations/check-connection` from the existing `posthog_daily_digest` workflow; failure pages on-call via Slack.

---

## Open follow-ups (not blocking adoption)

* Wire Postiz analytics → our Neon warehouse via `analytics-nightly` (Postiz exposes `GET /public/v1/analytics/post/:id`).
* Hook up Postiz MCP to the admin Studio so an operator can say *"publish job 123 to TikTok + Shorts"* in plain English from the admin chat surface (post-launch).
* Add a per-platform watermark/aspect transform step before upload (Postiz hands off raw media; we already render correct 9:16 / 1:1 / 16:9 inside Remotion templates).
