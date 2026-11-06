# Independent corrected printable boundary re-review

Date: 6 November 2026. Review only. Candidate files and their receipts were not edited.
Workspace: /workspace/scratch/01b5e2aee9f5/nurospark-printable-boundary-20261106
Basis: local HEAD 2a2800cbba004a4b3fe96760e14cba22b47c4469, representing remote PR #4 head 6ce15458a3bc56b22920af86f1efcbd67e1d228a.

## Verdict

Accepted as a bounded source correction and evidence checkpoint. No additional blocking defect was found in the new in-memory cache, scope wiring or cache-completion fencing. The prior introduced persistent-context finding and the demonstrated older-completion cache overwrite are resolved within this stated scope. Evidence drift is resolved. This is not release, end-to-end privacy, full UI race or child-safety acceptance. Keep draft and the documented integration gates open.

This review does not authorize publication, merge or deployment. Remote successor/exact-head state must be checked again immediately before any authorized publication. No remote mutation was performed for this re-review.

## Findings resolved

1. Persistent plaintext request context: guideClient contains no browser-storage access. A WeakMap indexed by explicit opaque local scope owns at most one validated guide/request identity. Unscoped calls do not cache. Cache writes set a five-minute expiry and timer; reads reject expired entries without extending retention. Displayed React state and active requests have separate lifetimes, as the documentation correctly explains. Historical localStorage entries are not erased; no deletion is claimed.
2. Owner/child cache reuse: GeneratorScreen creates scope with useMemo dependencies user.id, user.supabaseUid and activeChild.id and clears the prior scope on effect cleanup. New mounted screen instances create fresh scopes. Identical request content cannot cross scopes, and scope IDs are not transmitted. This is source-level wiring review, not React/StrictMode or backend ownership verification.
3. Older remote completion overwrites: a unique per-request generation is recorded before fetch. Only the matching latest remote generation can write; clear invalidates pending writes. Success/failure orderings and changed request identities are covered. Expiry removes entry/timer without cancelling a newer pending generation. Callers still receive their own results, intentionally leaving UI cancellation separate.
4. Evidence mismatch: all eight source/runner hashes match before and after testing. All six receipt-manifest entries match. Historical interrupted receipts are clearly separated, and the new audit distinguishes regression tests from risk characterizations and canonical unrun cases.

## Independently executed evidence

Runtime Node v24.22.1, native TypeScript stripping. All requests and guides synthetic; network entrypoints denied. No installs, provider calls, real child/private data, credentials, blocked-route retries, browser actions, merge or deployment.

- Current exact-source supplemental suite: 39/39 pass, zero failure/skip, exit 0. Fresh candidate.tap.
- Identical suite against the independently materialized unchanged PR #4 baseline source: 8 pass / 31 fail, exit 1. Fresh baseline.tap. The runner's documented optional-scope adapter does not replace baseline source/cache behavior.
- Existing limits suite: 5/5 expected limitations observed, exit 0. Fresh limits.tap. These are not safety passes.
- Independent additional exact-source suite: 7/7 pass, exit 0. independent.test.mjs / independent.tap. Covers deadline-read expiry during pending refresh, idle-timer expiry during pending refresh, clear-and-reuse with old completion, old completion before newer response, input/request aliases after cache write, returned live-response aliases, and clearing one scope without cancelling another scope's work.
- git diff --check passed. All current source/receipt pins match after execution.
- Canonical test count independently confirmed: 23 ordinary plus eight parameterized = 31 authored Vitest cases, all unrun. Do not add overlapping suite counts.

The independent tests use the candidate's exact production modules, with only the Supabase info import replaced by a synthetic endpoint. They do not load or execute GeneratorScreen in React.

## Residuals: keep explicit and open

- UI late responses remain unconditional: GeneratorScreen still applies guide/status/loading after await on changed child/pack/account, newer actions or unmount. Cache scoping prevents cache reuse, not stale on-screen exposure. Existing displayed guide state is not cleared by this cache scope change. Frontend lifecycle tests and correction remain a separate gate.
- Arbitrary HTTP(S) image origins, loopback/private destinations and URLs containing child context are still accepted and used as img.src. No live image was loaded. An image-origin/consent policy is not established by the current scheme filter.
- Full request identity protects local cache reads but is not echoed/authenticated by the provider response. Old enrichment from a different mood/content revision can pass legacy pack IDs; authored steps/materials/warnings are correctly rebound. Valid timestamps do not prove freshness. Adaptations can contradict warnings and retained text/array lengths remain unbounded.
- includeImages=false is not an AI-text opt-out. Pause/consent/provider-minimization and guardian/account provenance remain separate. The existing childAge=ageTier caller mapping and server eight-card cap remain unchanged.
- Old persisted guides remain physically present. Current cache expiry does not erase visible React state, pending request closures or legacy entries. Audit wording accurately avoids broader deletion/anonymization claims.
- No node_modules exists in this checkout. Typecheck/lint/Vitest/build, Deno/Edge/schema, React/StrictMode, browser/Capacitor, print/export, full verify/verify:full and real integration remain unrun. No dependency route was retried.

## Frozen source SHA256

0af2ff718c15a4c790b593d80942bf19f007ad7738b4338efe208d21c5914c91  src/lib/printables/guideClient.ts
54e67a871849d6e19f7eff87d7cac82065da1d83f001ad89ebb8174475962c14  src/lib/printables/guideValidation.ts
604fde8fce3e40c65e2f514c2509961ad73b0268d8267f1adbaf96d703950c9e  src/lib/printables/guideFallback.ts
94a1ba9e70240cfc80095186f8b374d6f5fe8276aa5e77d1001a0dfb1074f452  src/lib/printables/guideTypes.ts
ce3443f1893b6001ae14d593cc076b2cddcbaa907e7f664af14729ac93478019  src/lib/printables/guideClient.test.ts
7cdc753c437e2081dc30e3a075acca4444d0f8fa0c1ffd715655ba75971e4038  src/app/screens/GeneratorScreen.tsx
3385a1193b127c3c4fea06da13cf784c6a97169cc6741435cdcfd4d1dc2e3aab  scripts/qualification/printable-boundary.test.mjs
b312b1a6090d3984dc0d5a47173d7eb1e7526eeb9e7afc0f813753513c35312b  scripts/qualification/printable-boundary-limits.test.mjs

## Review artifact hashes

- baseline.tap: bbdf44f91c4ee07758b2449c2f3650b8caa1fecfefa5413d36f24f6bbd897e9b
- candidate.tap: f642d633b022d8267bd4179c70646f7549cf7f26ec5394342f44f3c4e03927c1
- independent.tap: 9c5a9d21b70145d7bd16f63ba48a5fae322f16c967798a408d11129890d0b77a
- independent.test.mjs: 6852cb1c7add4e192e6ca1ea4b3504dd04fd1366ff3845a977d6ca77b3e6f8cc
- limits.tap: ce2099c3b71c8f5938e9acb4b83bc78f58dea8b55e2d27dbc4ccb3154a69c1e0
