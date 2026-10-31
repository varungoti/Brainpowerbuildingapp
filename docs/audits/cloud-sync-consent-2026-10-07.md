# NuroSpark cloud sync consent and account-boundary audit

## 31 October 2026 qualification and sign-out copy correction

Continued the same draft PR from `cf91d8153253f26eb2be86045e58cf46822cd83e`. The official frozen dependency install now reaches a concrete blocker: HTTP 403 for locked `node-releases@2.0.36`. No retry or mirror bypass followed. Canonical typecheck/lint/Vitest/build, voice-plugin compile and the 69 authored cases remain unrun; no release-ready claim is made.

Independent exact-source helper execution passed 10 synthetic Node checks. This initial run preceded the independent-review freeze and is not retroactively described as admitted or independently reviewed. The retained helper source, hashes, bounded command and result are documented in [the dated qualification evidence](evidence/cloud-sync-2026-10-31/qualification.md). These checks are not React/Vitest or semantic typechecking.

A caller audit found that the existing Profile confirmation incorrectly promised to clear all local data even though logout deliberately retains saved reports and other derived data. This update changes only that confirmation copy and adds a source-copy regression: starting source 2 failures/1 pass, corrected source 3 passes. TypeScript 5.8.2 TSX syntax parsing reports zero diagnostics; full semantic typecheck/build/browser layout remain unverified. Existing confirm/cancel handlers, local deletion, cloud retention, ownership quarantine and recovery semantics are unchanged. All 32 locale files and other open-PR paths were checked; this existing English-only surface has no matching localization key and no overlap with payment PR #2.

Independent rereview identified a heading-scope mismatch with Supabase's default global sign-out. The frozen correction uses “Sign out?” and adds a source-copy assertion against device-only scope wording, without changing authentication behavior. The supplemental helper explicitly requires verified Node 24.22.1 native TypeScript stripping/registerHooks, not the repository's Node 20 CI runtime. Old results remain historical. After acceptance of the revised freeze, two separately admitted, bounded serial Node 24.22.1 invocations passed: exact-source helper10 and revised source-copy4, each exit 0 with no failed/skipped/cancelled tests. All pins matched before execution; production/runner bytes remain frozen. These are not canonical Vitest/React/typecheck/build results. Raw logs, exact commands and outcomes are retained in the dated evidence; final publication-diff review is pending.

The prior entries below remain dated historical evidence; the current dependency denial supersedes their statement that no install was attempted. Main remains unmerged and deployment was not performed.

## 23 October 2026 update: source-reviewed draft, acceptance incomplete

This update supersedes the current-scope and current-acceptance statements in the historical 7 October record below. It extends the existing consent PR #1; payment PR #2 is unchanged. Starting PR head: `8fde2bd7f151f10eb09c5e3c234ac286853e496f`. Main remains `836da44bcb96faab395ce2bf15df7d312b4eea63` at this checkpoint. A complete repository checkout was used for this update.

Requirements were reconciled against the current project registry, consolidated NuroSpark master version 3, and retained-source companion version 1. Relevant consent/authority and exact-source acceptance references remain NS-D06, NS-D08, NS-S19-P0061 and NS-S52-P0420. This patch does not close the master plan's broader guardian/backend, release, or cross-device requirements.

### Additional demonstrated defects

Synthetic execution of the exact starting-PR source reproduced:

- A failed opt-in preference write left the card visually enabled although transport consent was off
- Old pull/upload results could unlock or overwrite a newer operation's status after off/on
- A captured account A snapshot could be sent using a subsequently resolved account B session
- Queued uploads and suspended session lookups could continue while asynchronous logout was pending
- An auth identity transition did not immediately invalidate queued work
- Logout retained derived family data; a later B login and re-opt-in could send that retained A data under B
- An older logout completion could clear a newer login's child or a just-restored family

These are source-verified risks using synthetic fixtures, not findings of production exposure.

### Current repair and compatibility

The existing transport consent-generation contract is preserved. The preference setter now reports effective state and persistence success, and in-process observers keep the card aligned with lifecycle revocation. Failed opt-out writes remain denied for the current session; the warning explicitly describes the reload limitation. UI generations ignore obsolete completions and invalidate pending handlers on unmount. A successful GET check is no longer called a completed sync; only a successful POST is labeled uploaded.

Auto and manual callers capture independent snapshot ownership before session lookup and require an exact matching session user and a nonempty token. Logout and auth identity changes revoke consent synchronously, before asynchronous cleanup. Session generations and the pending-logout marker prevent old logout callbacks/completions from deleting newer account or restored local work, while preserving explicit local-only logout. Same-account token refresh does not revoke consent.

`cloudSyncOwnerId` and `cloudSyncQuarantined` are optional persisted metadata. A genuinely empty new family can bind to its first authenticated account. Previously marked same-owner snapshots remain eligible. Provenance survives logout and is never reassigned by signing in as another user. Account mixing, ambiguous ownership, and imported backups are quarantined. Successful backup import also invalidates pending work.

**Intentional migration limitation:** every unmarked legacy signed-in family and every imported backup remains locally usable but cloud-quarantined. The old current-user label is not ownership proof: exact old-version A logout → B login retained A's derived collections while labeling the state B. No data is deleted by this migration. Signing in again, returning to the original account, or toggling sync does not remove quarantine. The UI immediately explains the paused state and effective consent is revoked. A separately reviewed ownership-recovery/migration experience remains required; this patch does not invent an automatic transfer or an ownership override.

The existing opt-in GET response is checked but **never imported or merged**. Old-account pulls cannot restore A's data into B because no response application exists; obsolete completion feedback is ignored. This is not cross-device restore acceptance.

No routes, payment implementation, backend/API endpoints, authentication configuration, package manifests, lockfiles or dependency versions are changed. The transport's established result/error and already-dispatched-request semantics are preserved.

### Current executed evidence

Runtime: Node `24.19.0`. No packages were installed. Node's native TypeScript stripping executed the exact extracted handlers/effects and actual transport/session/backup/ownership functions with synthetic hooks, storage, sessions, timers and fetch. TCP/TLS connection entrypoints were denied. These checks are not React rendering, Vitest, or a TypeScript typecheck.

- Three UI negative controls reproduced on the starting PR; all three candidate scenarios passed: failed-save effective state, stale pull status, and stale upload status
- Seven account/restore negative controls reproduced on the starting PR; all ten candidate scenarios passed: session-owner mismatch denial, queued logout cancellation, suspended lookup cancellation, auth-transition cancellation, retained-data non-relabeling, newer-login preservation, restored-family preservation, explicit local-only logout, preserved same-owner upload, and effect cleanup of suspended lookup
- Exact historical upgrade control passed: execute the starting PR's `clearPersistedRemoteSession(A)` and `syncPersistedSessionUser(B)`, serialize/reload their unmarked output, then initialize the candidate ownership metadata. A's narrative/report history remains local, owner is null, and cloud eligibility is denied
- Independent source review reran the bounded evidence and additional delayed-event/restore/local-only logout checks. Reported migration and logout findings were repaired and rereviewed; no remaining material defect was found in this bounded source review
- `git diff --check`: passed

The checked-in canonical regression suite now has **69 cases** across transport (33), ownership (10), card (14), and provider lifecycle (12). These counts describe tests authored, **not a passing Vitest run**. Existing session and backup helper suites also need rerunning. Exact new coverage includes A → logout → B → re-opt-in, old-version upgrade, storage failures, overlapping off/on, unmount, old-account pull completion, local-only logout, and restore during delayed logout.

The pinned `pnpm 10.30.3` / TypeScript `5.8.2` dependencies were unavailable in this validation workspace. Current canonical typecheck, lint, Vitest, build, React/StrictMode integration, browser/Capacitor/device and multi-tab tests remain **unrun**. Historical 7 October passing counts below do not qualify this expanded candidate. Required commands in a prepared checkout:

```sh
pnpm exec vitest run src/lib/sync/cloudSync.test.ts src/lib/sync/cloudSyncOwnership.test.ts src/components/sync/CloudSyncCard.test.tsx src/app/context/AppContext.cloudSync.test.tsx src/app/logic/sessionSync.test.ts src/utils/neurosparkBackup.test.ts
pnpm run verify
```

The repository requires `verify` after substantive edits and `verify:full` before full release confidence. This draft is not a claim that either gate passed. Browser/admin setup scripts require their own prepared test environment; no production credentials or real family data should be used.

### Current boundaries and rollback

Opt-out cannot recall a request already handed to fetch, erase prior cloud records, or guarantee a failed preference write survives reload. The in-process listener and consent generation are not multi-tab/cross-device synchronization, backend authorization or guardian identity proof. Tenant isolation, server retention/deletion, real auth-event ordering, and a safe legacy/import recovery path remain independent acceptance gates.

Current scope is six production files (`cloudSync.ts`, `cloudSyncOwnership.ts`, `CloudSyncCard.tsx`, `AppContext.tsx`, `sessionSync.ts`, `neurosparkBackup.ts`), four focused test files, and this audit. Keep transport/callers/provenance logic coherent when reviewing or reverting. Removing provenance enforcement would reopen the identified privacy boundary; do not interpret a mechanical revert as an acceptable data migration. No merge, deployment, real user session, provider transaction or database mutation was performed.

## Historical 7 October record (v1 only)


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
