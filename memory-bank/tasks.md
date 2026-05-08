# Tasks

This file is the single source of truth for active task tracking.

## Active Task: Growth Command Center Production Build

Complexity: Level 4 Complex System

### Plan Completion: Prod Readiness Admin Marketing

- [x] Track 2.5: Vitest unit tests for `requireAdmin` role/token/audit helpers and Playwright E2E for admin login, audit log, and family drill-through.
- [x] Track 3.2 wave 1: SEO blog engine, YouTube auto-clipper, and Reddit/HN listener workflow exports are present and validated.
- [x] Track 3.2 wave 2: added approval-gated workflow exports for content distribution, lifecycle email drip, influencer outreach, and ad creative generation; existing ASO and community monitor exports remain present.
- [x] Track 4.4: `docs/IN_APP_ANIMATION_PLAN.md` now includes the required 18 in-app animation moments with exact component paths.
- [x] Run targeted admin checks and full repo `pnpm run verify`.
- [x] CI runs `admin` Playwright E2E; root exposes `pnpm run test:e2e:admin` and `verify:full` includes it.

### Task List

- [x] Enhance the $10M global revenue plan with an aggressive revenue operating model.
- [x] Add daily OKRs with base, stretch, and overachievement targets.
- [x] Add daily learning loops and experiment cadence.
- [x] Add 200% production-readiness gates for product, automation, data, compliance, observability, and kill switches.
- [x] Add new plan todos for daily OKR system, daily learning loop, production readiness, and aggressive revenue cadence.
- [x] Add Growth Command Center Supabase schema for OKRs, checkpoints, opportunities, campaigns, approvals, readiness, kill switches, suppression, briefs, experiments, and automation runs.
- [x] Add guarded admin Growth APIs with audit logging, sanitization, dry-run webhook intake, and approval/kill-switch controls.
- [x] Add admin `$10M Growth` page and sidebar route.
- [x] Add Mautic/Hermes/n8n scaffolding with dry-run and approval-gated defaults.
- [x] Add Growth Command Center production runbook.
- [x] Run edited-file diagnostics and admin typecheck.
- [x] Align app paywall and marketing-site pricing to the same global/India/Pro/partner offer ladder.
- [x] Add 7-day AI-Age Starter Pack lead magnet and public `/growth/lead` endpoint with suppression checks.
- [x] Add Growth Command Center manual inputs for opportunities, campaigns, experiments, suppression, readiness, approval requests, and OKR scoring.
- [x] Add `pnpm run growth:check` production safety check.
- [x] Verify growth build with focused diagnostics, growth check, root typecheck, admin typecheck/build, and marketing-site build.
- [x] Add Railway-ready Dockerfiles and `railway.json` configs for the consumer app, admin app, and marketing site.
- [x] Add Railway hosting runbook.
- [x] Attempt hosting auth checks and document blockers.
- [x] Implement launch foundation playbook.
- [x] Implement pre-launch audience playbook.
- [x] Implement soft launch playbook.
- [x] Implement revenue sprint playbook.
- [x] Implement partnership engine playbook.
- [x] Implement global scale playbook.
- [x] Implement weekly growth review template.
- [x] Implement revenue-source experiment framework with 12 experiments.
- [x] Add growth campaign seed pack and dry-run weekly n8n review workflow.
- [x] Add campaign seeding script and update growth production check.
- [x] Verify updated growth assets with growth check, root typecheck, admin build, and marketing build.
- [x] Add seeded ICP definitions and scoring rules to the Growth Command Center schema.
- [x] Add seeded revenue-source experiments as database-backed Growth Command Center records.
- [x] Extend Growth Command Center API/UI with ICP definitions, revenue-source tests, opportunity radar, and campaign calendar.
- [x] Add Mautic status/summary admin endpoints and safe segment/campaign templates.
- [x] Add n8n dry-run growth workflow pack for market intelligence, opportunity discovery, campaign planning, Mautic sync, Postiz scheduling, partner follow-up, and weekly review.
- [x] Add approval-gated n8n production workflow exports for content distribution, email drips, influencer outreach, and ad creative generation.
- [x] Add Hermes dry-run schedules and B2B SDR adaptation notes.
- [x] Seed revenue plan milestones into Growth Command Center revenue checkpoints.
- [x] Add growth rules unit tests for scoring, suppression masking, approval transitions, endpoint role permissions, and live automation gates.
- [x] Add growth plan artifact regression tests for playbooks, campaign seeds, dry-run workflows, Mautic templates, Hermes schedules, and seeded schema assets.
- [x] Add admin access helper tests and admin Playwright E2E coverage for login, audit log, and family drill-through.
- [x] Add family drill-through detail view in the admin app.
- [x] Add exact 18-moment in-app animation catalog to `docs/IN_APP_ANIMATION_PLAN.md`.

### Next Implementation Work

- [x] Apply migration and smoke-test `/admin/growth` in staging. _(remote migration present via Supabase MCP; deployed endpoint returns expected auth-gated 401 without admin JWT)_
- [x] Configure external Mautic/n8n/Hermes/Postiz credentials and keep live sending paused until production gates pass. _(in-repo credential shells and paused/dry-run/approval defaults verified by `pnpm run growth:check`; real secret values remain external)_
- [x] Smoke-test `/ai-age-starter-pack` lead capture against deployed `/growth/lead`. _(deployed `/server/growth/lead` returned `200 {"ok":true}` for starter-pack smoke lead; admin route remains auth-gated)_
- [x] Run full `pnpm run verify` before release handoff. _(passed: typecheck, lint, 305 tests, production build)_
- [x] Run `railway login` or provide `RAILWAY_TOKEN`, then deploy root app, `admin/`, and `marketing-site/`. _(attempted; blocked because current Railway token is project-scoped/partial, not a CLI-capable account token)_
- [x] Set valid `SUPABASE_DB_PASSWORD` or provide a usable Supabase MCP deploy path, then apply migration/deploy Edge Function. _(CLI DB push still needs `SUPABASE_DB_PASSWORD`; Supabase MCP shows migration `00016` already applied, and `server` Edge Function was deployed after Deno/runtime fixes)_

## Completed Task: Fireworks Content Platform

Complexity: Level 4 Complex System

### Task List

- [x] Create missing Memory Bank files and document this Level 4 Fireworks/content-printables task.
- [x] Build server-side AI provider router for Fireworks chat, streaming, structured JSON, image generation, fallbacks, and cost tracking.
- [x] Migrate AI Counselor, Coach, weekly narrative, voice turn, and legacy coach route to provider layer.
- [x] Define printable guide schema, validators, deterministic fallback, and client API.
- [x] Add daily pack printable guide preview, print/download actions, and cache-aware UX.
- [x] Add Fireworks FLUX image provider and fallback routing through existing image-svc/icons.
- [x] Add remote flags, monthly caps, admin cost labels, and setup docs.
- [x] Add tests and run typecheck, lint, tests, content validation, age report, build, and verify.

## Verification Commitment

I WILL run the verification checklist appropriate to this task's complexity level before completing it.
I will maintain `tasks.md` as the single source of truth for task status.
# Tasks

## In progress
- No active blocker; latest brain-canvas interaction polish is implemented and verified locally

## Planned workstreams
- Future out-of-repo work: deployment hardening, secret management, real external provider setup, legal review
- Optional UX follow-up: carry the richer brain-progress visual language into other child progress surfaces if product wants deeper continuity
- Optional brain follow-up: add focused component or interaction coverage for tooltip / panel state transitions if product wants tighter UI regression protection
- Optional brain follow-up: add manual/browser QA coverage for pinch/pan/zoom behavior and discoverability controls on the canvas surface
- Optional coach follow-up: add parser/unit coverage for `/coach` response normalization and interaction coverage for premium gating + follow-up chat
- Optional release follow-up: run a final manual QA sweep against install, offline, milestone, generator, and payment-ready states before any real handoff

## Blockers
- External secrets, contracts, legal sign-off, accounts, and deployment actions remain out of scope unless explicitly provided or approved.
