# NuroSpark cloud sync consent race audit

Date: 7 October 2026. Scope: NS-D06 guardian authority and current cloud-sync opt-in enforcement; NS-D08 exact-source acceptance.

## Source and requirements

Repository: `varungoti/Brainpowerbuildingapp`. The inspected protected `main` remains `836da44bcb96faab395ce2bf15df7d312b4eea63`; no open PR was found during this assessment. The reviewed local source snapshot contains the exact Git-blob-verified transport, existing test, two callers, package manifest, and Vite configuration. This is not a full repository checkout.

The current consolidated master is version 3 and its retained-source companion is version 1. Existing source aliases `NS-S19-P0061` and `NS-S52-P0420` describe opt-in and authenticated-session checks before auto-push. Their historical completion labels do not establish send-time consent enforcement. The current master requires synthetic family tests, consent revocation and truthful verification boundaries.

The following seven referenced documents are still absent from the pinned tree and remain source gaps: `docs/PRODUCT_ANALYTICS.md`, `docs/README.md`, `docs/ENVIRONMENT_AND_STAGING.md`, `docs/PWA_OFFLINE.md`, `docs/CONTENT_MEDIA_ORCHESTRATION.md`, `docs/THREAT_MODEL.md`, and `docs/RELEASE_CHECKLIST.md`. This change does not infer their contents or close their requirements.

## Reproduced defect

The existing AppContext checks opt-in, awaits session lookup, and queues a persisted-state snapshot through `pushStateDebounced`. That transport waits four seconds before calling `pushStateNow`. The existing preference setter only writes local storage; it neither cancels that timer nor checks consent at dispatch. Manual push/pull similarly await session lookup before calling the transport.

An exact-source synthetic Node harness demonstrated a stubbed POST after each of these operations: queue then disable; schedule while disabled; revoke the stored flag before timer dispatch; disable then re-enable without a fresh snapshot; and manually invoke a push while disabled. No real child data, session, provider or network request was used.

The unchanged transport passed the eight existing behavior tests. Expanded consent regressions exposed **13 failures** before the production repair, while 12 cases passed.

Independent review then rejected the initial transport-only candidate despite its 25 passing focused tests. A caller could capture an old snapshot, await its session, survive off/on, and arrive after fresh work. The stale auto caller replaced the fresh timer; the actual manual handler uploaded its old snapshot after the new one. This initial candidate is retained as v0 evidence, not accepted as the final fix.

## Bounded repair

- Cancel the pending timer synchronously when opting out, including a zero-valued timer handle
- Reject scheduling while disabled, and recheck the stored/current-session preference when a timer fires
- Reject direct push/pull calls while disabled, covering callers resumed after asynchronous session lookup
- Check again after snapshot serialization immediately before initiating a push
- Keep an explicit opt-out denied in memory for this session if its storage write fails; only a successful explicit opt-in clears that denial
- Capture an explicit consent-operation token in both existing callers before asynchronous session lookup or snapshot preparation; every opt-out advances its generation, including when persistence fails
- Require that token at transport entry and reject stale generations before replacing a pending timer and before network dispatch, including after an off/on cycle
- Preserve enabled latest-snapshot debouncing, callbacks, success/error/conflict responses and existing transport/auth configuration

An off/on cycle does not restore a canceled snapshot or authorize a suspended operation captured under the old consent generation. A newly captured, enabled operation may queue a new snapshot. AppContext's existing cancellation/cleanup remains intact. Only the consent-token handoff in its sync effect and CloudSyncCard's asynchronous handlers changes; UI appearance, backend, migrations, authentication settings, feature flags, default preferences and dependency versions are unchanged.

## Executed checks

Runtime: Node 24.19.0, cached Vitest 4.1.9, no installation. The focused transport tests now use a Node environment with explicit in-memory storage and mocked fetch rather than jsdom; no DOM behavior is under test. The eight pre-existing test cases pass in this harness before the repair.

- Existing focused baseline: **8 tests passed**
- Expanded suite against baseline transport: **13 failed, 12 passed**, exposing the consent gap
- Initial v0 focused suite: **25 tests passed**, but independent review found the suspended-caller defect above
- Final v1 repeat with Node TCP/TLS connection entrypoints denied: **29 tests passed**
- Isolated strict typecheck of transport and tests: **zero diagnostics**, cached TypeScript 5.9.3 with typed analytics/configuration stubs; this is not the repository's complete TypeScript 5.8.2 check
- Additional no-network execution of the exact TypeScript-AST-extracted AppContext effect and CloudSyncCard handlers: **five scenarios passed** against v1. The same harness reproduces the rejected v0 stale auto replacement and stale manual upload. It also checks stale opt-in pull, preserved effect cleanup and a successful same-generation manual request

Coverage includes asynchronous session-resolution opt-out, combined old-session/off/on/fresh-queue/old-resolution ordering, an old manual snapshot arriving after a new upload, stale opt-in pulls, disabled direct operations, immediate queue cancellation, external flag revocation at dispatch, unreadable storage, failed revocation/reenable writes, successful reenable after a failed revocation write, stale-queue suppression, latest-snapshot selection, callbacks, zero timer handles and off/on during serialization. One explicit test preserves the result of a request already handed to fetch rather than pretending it was recalled.

In a complete checkout with its locked dependencies, run:

```sh
pnpm exec vitest run src/lib/sync/cloudSync.test.ts
pnpm run verify
```

Only the focused synthetic checks and isolated typecheck were executed here. Full `verify`, production build, lint, browser/Capacitor/device tests and real Supabase integration were not run. Counts describe separate runs and are not additive.

## Boundaries and remaining acceptance

Opt-out prevents pending/new dispatch in this module and invalidates operations already awaiting sessions in the two updated callers. It does not retract a request already initiated, delete existing cloud records, invalidate an issued session token, or establish backend/tenant authorization. The operation token is an in-process sequencing contract, not a server credential or security boundary. A storage-failure denial is session-local and cannot be guaranteed across a reload that still reads the old persisted flag. Other tabs, sign-out races, account switching and backend retention need their own integration acceptance; rereading a revoked external flag at dispatch is not a global cross-device consent system.

No claims of legal compliance, clinical validity, child-development outcomes, complete deletion or full product readiness are established. Existing UI promises and broader privacy/analytics/provider behavior are outside this five-file slice. All fixtures are synthetic. No real child data, credentials, provider invocation, database change, deployment or merge was performed.

## Review and rollback

This audit records a local v1 review candidate based on the pinned commit. Changed files are limited to `src/lib/sync/cloudSync.ts`, `src/lib/sync/cloudSync.test.ts`, `src/app/context/AppContext.tsx`, `src/components/sync/CloudSyncCard.tsx`, and this audit. Recheck main and competing changes before publication/integration, and rerun affected checks after any changes. Protected main retains its existing acceptance process. Any automatic preview or production deployment side effect needs its separate publication gate.

Rollback is the inverse five-file patch as one unit; do not roll back callers separately from the required operation-token signature. No database, provider, account or stored user-data mutation is part of the implementation. Do not relax opt-out behavior to force a green test or describe a historical passing count as current end-to-end acceptance.
