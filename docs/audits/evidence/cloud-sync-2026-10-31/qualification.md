# 31 October 2026 consent qualification

## Scope and exact source

Continuation of draft PR #1 on `cf91d8153253f26eb2be86045e58cf46822cd83e`, with main/base `836da44bcb96faab395ce2bf15df7d312b4eea63`. Requirement references: NS-D06/NS-D08, master v3 pages 259–261, retained-source companion v1, aliases NS-S19-P0061/NS-S52-P0420. This is not a replacement work queue. Payment PR #2 is unchanged and has no overlapping files.

The only new production change is sign-out confirmation copy in `src/app/screens/ProfileScreen.tsx`. It replaces the false promise to “clear all local data” with the actual boundary: cloud sync stops, local child profiles/activity logs are cleared, some derived saved data stays on the device, and previous cloud uploads are not deleted. No logout, storage, quarantine, ownership, auth, backend, routes or recovery semantics changed. The existing confirm and cancel handlers remain intact.

Search of the complete source found this single sign-out confirmation; `ProfileScreen` does not use the i18n provider and none of the 32 locale files contains an equivalent sign-out/deletion key. This changes the existing English-only surface and does not claim localization acceptance.

## Dependency gate — failed, not a test verdict

The exact `pnpm 10.30.3` tool was obtained using Corepack. The frozen-lock install from the official npm registry stopped with `ERR_PNPM_FETCH_403` at:

`https://registry.npmjs.org/node-releases/-/node-releases-2.0.36.tgz`

Installer exit: **1**; final progress reported **667/691** packages downloaded/added. No mirror, credential, alternate artifact source or retry followed the denial. Root dependency links and `.bin` were never created, and Vitest's executable was absent. The standalone downloaded TypeScript executable reports `5.8.2`; that version probe is not a typecheck. `package.json` and `pnpm-lock.yaml` hashes remain unchanged.

The install was bounded to 600 seconds, with fetch retries disabled, download concurrency 4, child concurrency 1 and a 1536 MiB Node heap. A separate private temporary filesystem retained ample space; other work was not deleted. Direct owned-child termination/reaping worked in preflight, but `/proc` child enumeration was unavailable. No incomplete canonical suite was launched.

## Evidence actually executed

- **Initial exact-source helper qualification: 10 passed.** Node `24.22.1` native TypeScript stripping executed the actual `cloudSyncOwnership.ts`, `sessionSync.ts` and `neurosparkBackup.ts` files. Only existing relative `.ts` imports within the recovered checkout were resolved; no application or external package was substituted. Synthetic data only; outbound TCP/TLS blocked. A 60-second timeout and 256 MiB heap bounded the run. It finished normally in under one second.
- **Ordering disclosure:** that initial helper run completed before the subsequent independent-review freeze. `initial-helper-runner.mjs`, its input hashes and `initial-helper-invariants.log` are historical execution evidence, not a claim of prior independent admission or review. The portable same-source runner is `scripts/qualification/cloud-sync-helper-invariants.test.mjs`; it now uses a checkout-relative root URL and explicitly requires the verified Node 24.22.1 runtime; the original runner remains unchanged.
- **Sign-out source-copy negative control:** exact starting `ProfileScreen.tsx`, 2 failed / 1 passed. This reproduces the misleading all-data-deletion promise and missing retention/cloud-boundary explanation.
- **Candidate sign-out source-copy check:** 3 passed. It checks wording and preserved handler wiring, not React rendering or browser layout. Runner: `scripts/qualification/profile-signout-copy.test.mjs`.
- **TypeScript 5.8.2 TSX syntax parsing:** zero parse diagnostics for the changed profile screen. This is not semantic typechecking or a build.
- `git diff --check` passed. Manifest/lockfile hashes were unchanged.

The 10 helper tests cover genuinely empty first-owner binding, unknown/derived collections, legacy labels, A logout/B login, same-owner return, monotonic quarantine, imported backups, malformed metadata, absent/mismatched current user and preserved local-only accounts. Their counts are not added to the 69 canonical cases as if those had run.

## Caller/source review

Only `AppContext` and `CloudSyncCard` call the sync transport. Both capture consent-operation generation and independent snapshot ownership before awaiting session resolution. Backup import revokes consent and quarantines provenance. No additional production bypass caller was found. Logout and session helpers intentionally retain some derived data; the copy correction does not delete or automatically reassign it.

Read-only inspection of already-downloaded pinned `@supabase/auth-js` 2.99.2 source shows `_signOut` awaiting `_removeSession`, which awaits `SIGNED_OUT` subscriber notification before normal return. This supports the expected same-tab ordering but does not qualify cross-tab/device/failure behavior.

## Open acceptance gates

The **69 authored canonical cases remain unrun**: transport 33, ownership 10, card 14, provider lifecycle 12. Existing session/backup suites, canonical typecheck, lint, Vitest, build and local voice-plugin compile remain unrun because installation never completed. `pnpm run verify` and `verify:full` have not passed. Browser/StrictMode, native devices, backend guardian authority/tenant isolation, retention/deletion, ownership recovery and multi-tab/cross-device acceptance remain separate gates.

The existing-head CI run `39949658913` completed with `startup_failure` and zero jobs; it has no test verdict. Historical October 7 results do not qualify the expanded candidate.

## Reproduction after access is resolved

First reconcile the current remote source and obtain the complete frozen dependencies without bypassing the denial. Then run:

```sh
pnpm exec vitest run src/lib/sync/cloudSync.test.ts src/lib/sync/cloudSyncOwnership.test.ts src/components/sync/CloudSyncCard.test.tsx src/app/context/AppContext.cloudSync.test.tsx src/app/logic/sessionSync.test.ts src/utils/neurosparkBackup.test.ts
pnpm run verify
```

The dependency-free, explicitly noncanonical supplemental checks can be run separately. **The helper runner requires the verified Node 24.22.1 runtime**, including native TypeScript stripping and `node:module` `registerHooks`; this is not a recipe for the repository's Node 20 CI configuration. Do not infer support on another Node version or replace the canonical repository toolchain. Confirm `node --version` reports `v24.22.1` before running the helper:

```sh
node --require ./docs/audits/evidence/cloud-sync-2026-10-31/no-network.cjs --test scripts/qualification/cloud-sync-helper-invariants.test.mjs
node --require ./docs/audits/evidence/cloud-sync-2026-10-31/no-network.cjs --test scripts/qualification/profile-signout-copy.test.mjs
```

The historical runner in this evidence directory is retained byte-for-byte and contains its original temporary root URL; use the portable runner above for reproduction in a new checkout. `PROFILE_SOURCE_FILE` may point the copy test at an exact historical profile file for the negative control.

No merge, deployment, production credential, real family/minor data, provider transaction or database action was performed. Keep the PR draft and blocked for release. Revert only the copy patch to roll back this new UI change; never treat reversal of provenance enforcement as a safe ownership migration.

## Read-only publication preflight

On 31 October, Vercel repository-ID filtering for `1184888500` returned no projects both in the default account scope and its single visible team. The `neurospark` and `neurospark-admin` project details contain no Git repository link. Repository deployment workflows remain main/master-gated (or explicit manual dispatch); the existing consent branch does not satisfy those push triggers. No hosting/workflow setting was changed. This is a bounded source-publication check, not proof of deployment or of every possible external integration.

## Freeze / review disposition

At the first freeze, the portable helper runner and production copy were awaiting independent review; that portable runner had not yet been rerun. Nothing was pushed. Initial source-copy and TSX-parser results preceded restoration of the profile file's original no-final-newline EOF convention; visible content/handlers were identical, and final frozen-source re-execution was intentionally deferred until review. Published negative-control output has trailing whitespace on blank lines normalized for repository hygiene; the raw original output is retained in the durable checkpoint archive. No reviewed/admitted status is retroactively assigned to earlier runs.

## Independent-review correction — prior freeze

Independent source review identified one must-fix wording issue: “Sign out on this device?” implied a device-only auth scope, while `signOutSupabase()` calls the pinned auth-js 2.99.2 `signOut()` default `global` scope (GoTrueClient.ts lines 2319 and 2337). The revised heading is simply **“Sign out?”**. No auth behavior changed. A fourth source-copy assertion rejects device-only scope words in this heading.

The earlier helper10/source-copy3 logs are preserved as historical results; they do not certify this revised freeze. The portable helper now explicitly checks for the verified Node 24.22.1 runtime and documents native TS stripping/registerHooks requirements. Bounded rereview was subsequently accepted, followed by the admitted final frozen-source checks recorded below; an update to existing PR #1 still requires final publication-diff review. The 69 canonical cases and all dependency-blocked gates remain unrun; the denied package route was not retried.

## Final admitted frozen-source checks — 31 October 2026

The revised freeze was independently accepted **before** these two separately admitted serial invocations. All 31 source pins, exact reviewed patch and base head were verified first; `rereview-freeze.sha256` matched before both invocations. Node was verified as **v24.22.1**. Each command used a 60-second foreground timeout with 5-second kill-after, 256 MiB heap, the no-network preload, `--test-isolation=none`, `--test-concurrency=1` and `PROFILE_SOURCE_FILE` unset. One attempt each; no retry.

- Actual helper modules: **10 passed, 0 failed/skipped/cancelled, exit 0**.
- Revised candidate source-copy contract: **4 passed, 0 failed/skipped/cancelled, exit 0**. This includes the new assertion rejecting device-only auth-scope wording.

Both returned normally within a second. Raw final logs and exact commands/outcomes are preserved in `final-run-record.json`, `final-helper-invariants.log` and `final-signout-copy.log`. Historical logs and freeze hashes remain retained; no retroactive review claim is attached to the earlier runs. Production and runner bytes have not changed since the accepted revised freeze; this publication delta adds evidence and clarifies the audit only.

These remain **noncanonical helper/source-copy checks**, not 69 Vitest/React cases, semantic typechecking, browser layout, voice compilation, build or full release acceptance. The official HTTP403 was not retried. All canonical/full gates remain **UNRUN**. Nothing has been committed, pushed, merged or deployed; final publication-diff review is pending.
