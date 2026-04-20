# Postiz — self-hosted distribution layer

Postiz replaces Buffer as our primary publishing surface. It also collapses
the Medium / Dev.to / Hashnode HTTP calls our SEO blog engine used to fan
out manually into a single API call.

## Why we picked it

See `docs/POSTIZ_EVALUATION.md` — short version: free at our scale,
covers 15/16 channels we want, has first-party n8n + MCP + Node SDK,
and we're already self-hosting n8n so the ops cost is near zero.

## Run locally

```bash
cd automation/postiz
cp .env.example .env  # fill JWT_SECRET at minimum
docker compose up -d
open http://localhost:5000
```

First boot: create an admin account, then **Settings → Developers → Public
API → Generate API key**. Copy that key into `automation/n8n/.env` as
`POSTIZ_API_KEY`.

## Deploy to Railway

```bash
cd automation/postiz
railway up --service neurospark-postiz
```

Required Railway env (mirror of `.env.example` minus DB/Redis URLs which
Railway provides via its managed Postgres + Redis plugins):

| Env | Notes |
| --- | --- |
| `JWT_SECRET` | 32-byte random |
| `STORAGE_PROVIDER=r2` + `CLOUDFLARE_*` | Recommended for prod uploads |
| `FRONTEND_URL=https://postiz.YOUR_DOMAIN.com` | |
| `NEXT_PUBLIC_BACKEND_URL=https://postiz-api.YOUR_DOMAIN.com` | |
| Each provider's `*_CLIENT_ID/SECRET` | Only for the channels you connect |

## Connect channels (one-time per channel)

1. Sign in at `FRONTEND_URL`.
2. **Launches → Add channel → pick provider**.
3. Walk through OAuth.
4. The channel's UUID appears in the URL — copy it into
   `automation/n8n/.env`:
   - `POSTIZ_CHANNEL_INSTAGRAM`
   - `POSTIZ_CHANNEL_TIKTOK`
   - `POSTIZ_CHANNEL_YOUTUBE`
   - `POSTIZ_CHANNEL_X`
   - `POSTIZ_CHANNEL_LINKEDIN`
   - `POSTIZ_CHANNEL_BLUESKY`
   - `POSTIZ_CHANNEL_THREADS`
   - `POSTIZ_CHANNEL_MASTODON`
   - `POSTIZ_CHANNEL_REDDIT`
   - `POSTIZ_CHANNEL_PINTEREST`
   - `POSTIZ_CHANNEL_MEDIUM`
   - `POSTIZ_CHANNEL_DEVTO`
   - `POSTIZ_CHANNEL_HASHNODE`
   - `POSTIZ_CHANNEL_TELEGRAM`
   - `POSTIZ_CHANNEL_DISCORD`

## How n8n calls it

We added `automation/n8n/workflows/lib/postiz_publish.json` — a reusable
sub-workflow that takes `{ channelIds[], content, mediaUrls[], settings }`
and POSTs to `{POSTIZ_BASE_URL}/public/v1/posts`. Three real workflows now
call it:

- `daily_shorts_factory.json` (after Studio MP4 is rendered)
- `youtube_clipper.json` (after Opus Clip returns)
- `seo_blog_engine.json` (after the LLM draft is approved in Slack)

Each retains the original Buffer step behind `IF $env.USE_POSTIZ === 'false'`
as a kill-switch fallback.

## Embedding inside the NeuroSpark admin

The admin app's **Social publishing** tab embeds the Postiz UI in an iframe
(see `admin/src/pages/social/SocialPage.tsx`). For the iframe to render,
your reverse proxy in front of Postiz must allow framing by the admin
origin. Examples:

**Caddy**
```caddyfile
header {
  -X-Frame-Options
  Content-Security-Policy "frame-ancestors 'self' https://admin.YOUR_DOMAIN.com http://localhost:5173"
}
```

**Nginx**
```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://admin.YOUR_DOMAIN.com http://localhost:5173" always;
proxy_hide_header X-Frame-Options;
```

If you can't (or don't want to) loosen framing, the admin tab still works:
the OAuth flows + heavy interactions automatically open in a new tab via
the **Open in new tab** button.

## Health monitoring

The existing `posthog_daily_digest` workflow now pings
`{POSTIZ_BASE_URL}/public/v1/integrations/check-connection` and posts the
result in the Slack digest line.

## License note

Postiz is AGPL-3.0. We **call** it over its public REST API; we don't fork
or redistribute it. Our app code stays under our own licence. If we ever
bundle Postiz source into a customer-facing product, revisit this.
