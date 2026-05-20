I can help you get this deployed, but I **cannot directly deploy the live portal from here** unless I have access to your repo + hosting setup + environment configuration. I inspected the current zip: it is a **strong scaffold**, but not yet a complete one-click production app.

I created a deployment handoff zip for you:

[Download NuroSocial Deployment Handoff](sandbox:/mnt/data/nurosocial_deployment_handoff.zip)

It includes:

* the current `nurosocial_os_postiz_replacement.zip`
* a full deployment requirements and testing plan
* exact environment variables
* platform credential checklist
* live smoke testing checklist
* what to provide from your side

## What I need from you, step by step

### 1. Your codebase/repo access

Send me one of these:

* GitHub repo name in this format: `owner/repo`
* or upload your current full app zip
* or tell me the exact folder where you want this integrated

I need to know:

* main branch name
* package manager: `npm`, `pnpm`, `yarn`, or `bun`
* framework version
* whether the app is currently Next.js, Vite, Expo, or something else
* where your backend/API routes currently live

### 2. Hosting decision

For your low-budget situation, I recommend:

**Railway single project**

* Next.js app service
* Worker service
* Postgres
* Redis

I need from you:

* Railway project/workspace access
* current Railway project name
* whether you already have Postgres/Redis there
* your hard monthly budget limit

### 3. Domain

Send:

* domain/subdomain you want, for example `social.nurospark.in`
* DNS provider: Cloudflare, GoDaddy, Namecheap, etc.
* whether you can add DNS records

OAuth will not work properly until the final HTTPS domain is known.

### 4. Database + Redis

You need:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

Best low-cost options:

* Railway Postgres + Railway Redis
* or Neon Postgres + Upstash Redis

### 5. Secrets — do not paste them in chat

You must set these in Railway/Vercel env variables:

```env
TOKEN_ENCRYPTION_KEY=
OAUTH_STATE_SECRET=
CRON_SECRET=
SESSION_SECRET=
```

Generate them with:

```bash
openssl rand -base64 32
```

### 6. Media storage

For Instagram, TikTok, Pinterest, YouTube, and image/video publishing, you need a public media storage/CDN.

Use one:

* Cloudflare R2
* AWS S3
* Supabase Storage
* UploadThing

Required env:

```env
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
PUBLIC_MEDIA_BASE_URL=
```

### 7. Social developer accounts

For full automation, each platform needs official API/OAuth access. We cannot bypass this safely.

For Meta/Instagram/Facebook/Threads:

```env
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://yourdomain.com/api/social/oauth/meta/callback
FACEBOOK_PAGE_ID=
```

For LinkedIn:

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/oauth/linkedin/callback
```

For YouTube:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/social/oauth/youtube/callback
```

YouTube uploads through `videos.insert` require authorization and have a quota cost of 100 units per upload; uploads from unverified API projects may be restricted to private visibility until audit approval. ([Google for Developers][1])

For TikTok:

```env
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/social/oauth/tiktok/callback
```

TikTok Direct Post requires app registration, Content Posting API enablement, `video.publish` approval, user authorization, and unaudited clients may be restricted to private visibility. ([TikTok Developers][2])

For X:

```env
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=https://yourdomain.com/api/social/oauth/x/callback
```

For Pinterest:

```env
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
PINTEREST_REDIRECT_URI=https://yourdomain.com/api/social/oauth/pinterest/callback
```

### 8. Razorpay/payment links

For immediate revenue, this is more important than social APIs.

You need:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NUROSPARK_BETA_PAYMENT_LINK=
NUROSPARK_PREMIUM_PAYMENT_LINK=
NUROSPARK_ULTRA_PAYMENT_LINK=
```

## Current technical reality

The current package has:

* Prisma schema
* API route scaffolds
* queue/worker scaffold
* social provider adapters
* token encryption helper
* React Social OS panel
* tests/docs

But before live deployment, it still needs:

* full Next.js app shell
* `tsconfig.json`
* `next.config`
* root `app/page.tsx`
* real OAuth callback routes
* real provider adapter implementations
* production DB migration
* worker deployment
* env variables
* platform permissions/app approvals

## Practical launch order

To avoid delay and start generating revenue quickly:

1. Deploy CRM + content generator + payment links first.
2. Add manual WhatsApp click-to-send.
3. Add NuroSocial mock scheduler.
4. Add Telegram or Facebook Page publishing first.
5. Add Instagram after Meta app setup.
6. Add LinkedIn next.
7. Add YouTube only after channel/OAuth setup.
8. Add TikTok later because approval/audit can slow you down.

Send me your **GitHub repo name** and your preferred hosting path — Railway single project is my recommendation for your budget.

[1]: https://developers.google.com/youtube/v3/docs/videos/insert "Videos: insert  |  YouTube Data API  |  Google for Developers"
[2]: https://developers.tiktok.com/doc/content-posting-api-get-started/ "TikTok for Developers"
