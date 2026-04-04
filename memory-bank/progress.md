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
- Brain map interactive visualization with SVG, AI insights, coaching panel, canvas rendering
- Brain-canvas responsive pan/pinch zoom
- **Ultra Features (10 modules):**
  - AI Activity Adaptation (on-device adaptive engine, integrated into AGE scoring and logActivity)
  - Weekly Intelligence Report (15-region coverage report, data builder, PDF-ready screen)
  - Sibling Collaboration Mode (multi-child activity matching, role assignment, collab logging)
  - Voice Instruction Mode (Web Speech API narration for activities, per-step and full narration)
  - 10-Language Support (i18n context/provider, 10 locale JSON files + English, language settings screen)
  - Creation Portfolio (image capture, compression, auto-tagging, developmental stage inference, gallery screen)
  - Parent Coaching Mode (activity-level coaching overlay with timer, region-based guidance, /coach endpoint extension)
  - Seasonal Activity Library (season detection, seasonal scoring in AGE, seasonal banner on home, dedicated screen)
  - Sensory Modification Engine (sensory profiles, condition-based material/instruction adaptation, settings screen)
  - Community Activity Ratings (client scorer, CommunityBadge, AGE integration, Postgres aggregation migration)

## Remaining major areas
- External deployment, secrets, real payment/provider configuration, and legal sign-off remain out of scope.
- Premium TTS endpoint for voice mode (currently Web Speech only).
- Google Translate integration for dynamic i18n (currently static locale files).
- Email-based report sharing (currently download/share only).
- Capacitor camera plugin for native portfolio capture (currently web file input).

## Current state
- `pnpm run verify` passes: typecheck + lint (0 warnings) + 81 tests + build.
- `pnpm run age:report` and `pnpm run content:validate` pass.
- 34 new unit tests covering: adaptive engine, weekly report, sibling matcher, voice prompt builder, sensory adapter, season detector, community scorer.
- All 10 ultra modules have screens, engines, and components wired into the app router, profile screen, home screen, and activity detail screen.
- Supabase migration `00005_community_ratings.sql` is ready for `db push`.
- Server `/coach` endpoint extended with `activity-coaching` mode.
