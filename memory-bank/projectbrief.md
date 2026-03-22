# Project Brief

## Product
NeuroSpark is a parent-led child development app focused on evidence-aligned daily activities, outcome proxies, personalization, and safe AI-assisted guidance.

## Current scope
- Local-first family app with optional Supabase auth.
- Activity Generation Engine (AGE) with KYC-aware scoring, spacing, diversity, and AI-literacy track.
- Monetization, analytics, legal-trust, and backup/export foundations are in place.
- PWA/offline shell, richer curriculum metadata, and bounded content/media orchestration scaffolding are now in-repo.

## Current mission
- Harden the repository toward production readiness without relying on external accounts, secrets, paid services, or irreversible off-repo changes.
- Improve reliability, UX clarity, content quality systems, testing, and differentiation.

## Constraints
- Keep all existing `AppView` routes and major UI blocks reachable.
- Use `pnpm`.
- Do not rely on external integrations that require credentials unless explicitly provided.
- Maintain privacy-forward defaults for family/child-adjacent data.

## Success criteria
- Verification green: typecheck, lint, unit tests, build, and E2E where present.
- Open roadmap items advanced materially inside the repo.
- New systems are documented so future sessions can continue safely.
