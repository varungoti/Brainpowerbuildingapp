# Progress

## Already shipped recently
- Privacy-light analytics and optional Supabase ingest
- Playwright smoke E2E and CI integration
- COPPA/GDPR engineering checklist
- Environment/staging docs
- Optional Sentry setup
- Local backup/export + restore flow
- Supabase auth lifecycle hardening
- Legal/refunds draft screens and publishing checklist
- Responsive app shell + lazy-loaded screen chunks
- Unit/component/E2E coverage expansion with seeded flow tests
- PWA install assets, service worker, offline UX, and install CTA
- Richer activity metadata, adaptive outcome-pillar focus, and AGE simulation script
- Prompt/media orchestration scaffolding and content validation tooling
- Release, threat-model, performance-budget, moat, and offline docs
- Provided colorful brain image is now integrated into the brain map visualization and milestone tracker summary card
- The same colorful brain-progress language now extends into the home year-plan card and year-plan hero/progress surfaces
- The anatomical brain tracker now uses a muted base image with image-matched attribute colors and animated zone fills that reveal as activity-linked scores increase
- The brain tracker boundaries are now path-based rather than ellipse-based, so attribute regions are demarcated by explicit shape masks tied more closely to the source artwork
- The color-area mapping was tightened again so attribute masks track the visible colored segments more closely, with updated anchors and palette sync in the brain map UI
- The source brain artwork now also serves as a low-opacity segmentation guide under the grayscale layer so the real color areas remain visually legible during idle states and QA
- CI now enforces `content:validate` and `age:report` in addition to typecheck, lint, unit tests, build, and Playwright
- Playwright now covers offline AI/paywall messaging and milestone completion persistence in addition to onboarding, generation, activity detail, and backup flows
- The server function now restricts CORS to localhost plus explicit `ALLOWED_ORIGINS` entries and applies basic KV-backed rate limits to analytics, AI counselor, and payment routes
- Packaging metadata no longer uses the starter package name and now identifies the app as `neurospark`

## Remaining major areas
- External deployment, secrets, real payment/provider configuration, and legal sign-off remain out of scope.

## Current state
- `pnpm run verify`, `pnpm run verify:full`, `pnpm run age:report`, and `pnpm run content:validate` are available.
- Latest local verification is green for `typecheck`, unit tests, content validation, AGE reporting, production build, and Playwright E2E.
- The repo is materially closer to production-ready within local-only constraints.
