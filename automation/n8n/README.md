# NeuroSpark n8n marketing automation

Self-hosted n8n is the **orchestration brain** for our entire growth loop:
it calls the Studio orchestrator (Track 5) to build assets, hands them to
**Postiz** (the **distribution arm** — see `automation/postiz/`) for fan-out
to 15+ social channels, listens to community signals, and reports to Slack.

> Buffer is kept as a one-line fallback (`USE_POSTIZ=false`) for emergency
> cutover. As of April 2026 every workflow that publishes goes through
> Postiz by default — see `docs/POSTIZ_EVALUATION.md` for the rationale.

## Deploy

### Railway

```bash
railway up --service neurospark-n8n
```

The Dockerfile bakes the workflows under `/workflows`. Import them via the
n8n UI on first boot (Settings → Import from URL or copy/paste JSON).

### Local

```bash
cd automation/n8n
cp .env.example .env  # fill in required values
docker compose up -d
open http://localhost:5678
```

## Workflows shipped

| File | Cadence | Purpose |
| --- | --- | --- |
| `lib/postiz_publish.json` | (sub-workflow) | **Reusable Postiz fan-out** — call from any workflow with `{ posts:[...], scheduleAt? }`. Wraps `/public/v1/posts`, alerts Slack on failure |
| `daily_shorts_factory.json` | every day @ 13:00 UTC | Generate a 9:16 short via Studio → fan out to IG Reel + TikTok + YT Shorts + Threads + Bluesky via Postiz |
| `appstore_play_listings.json` | weekly | Sync App Store + Play listing copy/screenshots from `marketing-site/content` |
| `appstore_play_reviews.json` | every 6h | Pull new reviews into Slack + Supabase `feedback` |
| `youtube_clipper.json` | hourly | Auto-clip new YouTube videos via Opus Clip → fan out to IG/TikTok/YT Shorts via Postiz |
| `community_signal_monitor.json` | every 30m | Twitter / Bluesky / Reddit keyword scan → Slack |
| `seo_blog_engine.json` | daily | LLM drafts blog post → Slack approval → fan out to Medium + dev.to + Hashnode via Postiz |
| `weekly_intelligence_newsletter.json` | weekly | Email opted-in parents the rolled-up weekly intelligence report |
| `posthog_daily_digest.json` | daily | DAU / churn / cost rollup → Slack |
| `influencer_scraper.json` | weekly | Apify Instagram/YouTube scraper → enrich CRM in Supabase |
| `reddit_listener.json` | every 15m | r/Parenting + r/toddlers etc. → reply suggestions to Slack |

All workflows respect `N8N_MARKETING_MONTHLY_USD_CAP` — every node that calls
a paid API includes a guard `IF cost_used >= cap THEN halt`.

## Postiz integration pattern

Every workflow that publishes follows the same two-node pattern:

1. **`Build Postiz fan-out`** — a `Function` node that returns
   `{ posts: [{ provider, channelId, content, mediaUrls?, settings? }, ...] }`.
2. **`Publish via Postiz`** — an `Execute Sub-workflow` node calling
   `lib/postiz_publish`.

The sub-workflow handles JSON serialisation, the rate-limit headers, and
error reporting. To add a new channel, just append it to the `posts` array
and add a matching `POSTIZ_CHANNEL_<PROVIDER>` env var.

Connect channels in the Postiz UI (`POSTIZ_FRONTEND_URL`); copy the
integration UUID from the URL after each connection into the matching env
var. See `automation/postiz/.env.example` for the full list.
