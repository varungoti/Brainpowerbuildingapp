# PWA & Offline Behavior

NeuroSpark now ships a local-first PWA shell with install metadata, an app icon set, and a service worker for same-origin shell caching.

## What works offline

- Opening the already-installed or previously loaded app shell
- Local profiles, generated history already on device, backup/export tools
- Reading previously loaded screens and curriculum content

## What still needs internet

- AI Counselor requests
- Checkout / Razorpay flows
- Privacy-light analytics delivery
- Any future external provider-backed media generation

## Install path

- The manifest lives at `public/manifest.webmanifest`.
- Icons are in `public/icons/`.
- The app captures install prompts and exposes an install section in `Profile`.

## Service worker

- Registered in `src/main.tsx` via `src/utils/pwa.ts`
- Implemented in `public/sw.js`
- Uses:
  - app-shell precache for core local assets
  - navigation fallback to cached shell or `offline.html`
  - same-origin GET caching for static assets

## UX behavior

- A global offline banner appears for signed-in app views.
- `AI Counselor` and `Paywall` show explicit offline warnings instead of failing silently.
- Profile includes an install CTA when the browser exposes `beforeinstallprompt`.
