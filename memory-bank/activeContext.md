# Active Context

## Current task
Level 3 coaching workstream: add a monetization-ready AI Parenting Coach that uses `brainRegions` scores to generate structured guidance, daily plans, and follow-up chat from the brain map flow.

## Current focus
- Keep `brainRegions` as the single source of truth for coordinates, colors, graph relationships, and coaching score interpretation.
- Reuse the existing Supabase server function as the live AI backend surface so web and mobile stay aligned.
- Preserve the existing `BrainMapScreen` flow while layering in coach entry, premium gating, daily plans, and chat.

## Known boundaries
- No secrets, contracts, licenses, or external account setup.
- No irreversible external deployment/config changes.
- Preserve all routes and major user-facing screens.

## Immediate next steps
- Keep docs and memory bank aligned with the shipped coach + brain-map integration.
- If requested next, add targeted tests around coach response parsing and coach-panel interactions.
- Preserve the stricter CI, E2E, and server-hardening patterns for future changes.
