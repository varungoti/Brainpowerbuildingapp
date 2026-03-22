# Threat Model

## Primary assets

- Parent account identity
- Child profile and developmental history
- Local backups containing names and notes
- Payment initiation flow
- AI counselor prompts and responses

## Main attack surfaces

- Browser local storage and imported backup files
- Supabase-authenticated browser flows
- Edge-function endpoints for analytics, AI, and payments
- Client-side script loading for Razorpay
- Any future external media-generation pipeline

## Current mitigations

- Local-first persistence with optional auth instead of mandatory cloud sync
- Privacy-light analytics with allowlisted event names only
- Optional Sentry with `sendDefaultPii: false` and no session replay
- Backup import parser with runtime validation and replace-all confirmation
- App-level ErrorBoundary and stronger verification/E2E coverage
- Offline-aware UX to reduce ambiguous failures on network-backed screens
- No repo-local self-modifying or auto-publishing AI path

## Key risks still requiring care

- Local backups are sensitive files and should be handled as private family data.
- The browser remains a trust boundary: a compromised device compromises local data.
- Payment trust depends on correct external provider configuration not represented in-repo.
- AI counselor output is guidance, not diagnosis; draft copy must keep that boundary clear.
- SVG app icons are acceptable for modern install flows, but some platform-specific stores may still prefer PNG assets if distribution expands.

## Recommended next mitigations outside current repo scope

- Device-level encryption guidance for families
- Security headers and CSP review in deployed hosting
- Real server-side rate limiting and abuse controls on edge endpoints
- Formal secrets management and environment separation
- Legal/policy review before paid launch marketing
