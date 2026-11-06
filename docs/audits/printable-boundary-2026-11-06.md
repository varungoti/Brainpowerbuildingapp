# Printable response and cache boundary: correction and qualification

Date: 6 November 2026. Status: **independently accepted bounded source correction; draft publication
prepared; not release-ready**. This continues the interrupted boundary
candidate on printable fallback PR #4, not a duplicate implementation.

Remote basis: `6ce15458a3bc56b22920af86f1efcbd67e1d228a` on
`dot/nurospark-printable-fidelity-20261106`. The local snapshot HEAD is
`2a2800cbba004a4b3fe96760e14cba22b47c4469`; its three original printable source
blobs match that remote basis. No remote mutation was attempted during implementation or independent re-review.

## Requirement, owner and bounded plan

This is partial progress on NS-S51-P0004, NS-S51-P0008, NS-S53-P0006 and
NS-S53-P0010 from `memory-bank/productContext.md` and `memory-bank/projectbrief.md`.
It does not close overall child privacy, content safety, print quality or release
acceptance. Implementation belongs to this printable boundary candidate.
Independent re-review accepted the frozen bounded source correction; the project owner retains release,
merge, deployment and product/provider-policy decisions.

1. Preserve and inspect the interrupted candidate and independent findings: done.
2. Remove newly introduced persistent request context and bound cache lifetime: done locally.
3. Prevent older completions overwriting newer cache entries: done locally.
4. Refresh exact-source synthetic controls and reconcile evidence hashes: done.
5. Independently review the new source and evidence together: accepted; see the
   [review and additional probes](evidence/printable-boundary-2026-11-06/independent/REVIEW.md).
6. In a prepared authorized environment, run canonical and integration acceptance: unrun.
7. Recheck remote successors/uncertain writes before any authorized publication;
   preserve PR #4 and keep any publication draft: prepared. The PR description
   records the verified publication outcome and exact head after the write.

## Root cause and changes

The original client cached unchecked JSON under a key that omitted age, mood,
image preference and most authored content. It accepted unvalidated provider
objects. The interrupted candidate added full identity/shape checking and
request snapshots but serialized the complete request identity in localStorage.
That newly retained raw mood and authored request context in plaintext without
expiry or owner scope. Hashing a storage key did not anonymize the value.

The corrected client:

- Never reads or writes printable content to localStorage or sessionStorage.
  Previous plaintext cache entries are ignored, not erased. Existing unrelated
  application persistence is unchanged. This is not a deletion/migration claim.
- Uses an explicit opaque in-memory scope. GeneratorScreen creates a fresh scope
  for its current mounted instance, user ID/Supabase UID and child ID; changing
  any of these replaces the scope. Effect cleanup clears old cache state and
  invalidates in-flight cache writes. These IDs are not added to provider payloads.
- Retains at most one validated guide and exact request identity per scope for
  five minutes, measured from write, without extending expiry on reads. An idle
  timer drops the entry, and reads also check the deadline. Browser suspension
  can delay timers; expired entries are rejected when execution resumes.
- Does not cache unscoped calls. No cache is restored after reload/remount, no
  persistent cache namespace is added, and no encryption/anonymization is claimed.
  The five-minute cache is an optimization, not a security boundary against
  script access to a running page. Active requests and displayed React state have
  their own lifetimes and are not erased by cache expiry.
- Makes the last-started remote request in a scope the only one allowed to cache
  its completion, including failures/fallbacks and changes of request identity.
  Older callers still receive their own result. This is a cache race correction,
  not UI request cancellation or suppression of stale on-screen results.
- Preserves the candidate's explicit request projection, immutable request
  snapshot, malformed-response rejection and authored steps/materials/safety
  rebinding. Enrichment fields remain subject to the limits below.

There is no server/provider implementation, model/schema, consent, auth,
security setting, dependency, lockfile or endpoint change. Cache misses after
expiry, reload, child/account switch or screen remount cause the next explicit
create action to use the existing remote request path. This reduces persistent
cache reuse and may increase such requests relative to the old cache; no automatic
request, retry, background fetch, provider fallback or new data field is added.

## Evidence actually executed

Node `v24.22.1`, native TypeScript stripping, synthetic requests/storage/fetch.
TCP/TLS/HTTP entrypoints are denied by each runner. No browser request, real child
data, credential, provider call, package installation, blocked download route,
merge or deployment was used.

- `scripts/qualification/printable-boundary.test.mjs`: **39/39 pass**, exit 0.
  This covers full identity invalidation, snapshots, shape rejection, authored
  fidelity, storage nonuse, scope separation, retention, cleanup and overlapping
  writes. These are supplemental checks, not canonical Vitest or UI rendering.
- Identical runner against unchanged baseline source: **8 pass, 31 fail**, exit 1.
  The baseline has no scope API, so the runner's adapter only supplies the new
  optional scope argument and uses a no-op scope factory/cleanup when absent.
  It does not patch the baseline cache or response behavior.
- `scripts/qualification/printable-boundary-limits.test.mjs`: **5/5 expected
  characterizations observed**. These tests deliberately demonstrate remaining
  risks; they are not safety or acceptance passes and must not be added to the
  regression count as proof of correctness.
- Independent re-review repeated the 39-test candidate, baseline and limits runs
  and added **7/7 passing exact-source probes** for expiry during pending work,
  clear/reuse, response ordering, alias isolation and scope independence. These
  overlap the primary suite and are not added to its count. No blocking defect
  was found in the bounded source correction.
- `git diff --check`: passed for tracked changes. After staging all evidence,
  `git diff --cached --check` reports trailing whitespace only in the three raw
  baseline TAP receipts. Their original bytes and reviewed hashes are retained;
  the staged code/tests/documentation check excluding TAP receipts passes.
  This is a receipt-format warning, not an application test result. Source/runner
  hashes remain verified.
- `guideClient.test.ts`: **31 authored Vitest cases** (23 ordinary, eight
  parameterized), **unrun**. These overlap the supplemental suite; do not sum them.

Receipts are in `docs/audits/evidence/printable-boundary-2026-11-06/`. The current
source manifest includes the UI wiring, both runners, canonical test file and
all imported printable source modules. `receipt-manifest.sha256` pins the current
reports separately. `source-freeze.sha256` was generated only after final runner
edits and is checked before and after final runs.

The previous 27-test logs and stale manifest are preserved under
`historical-interrupted/`. That manifest predates the appended 28th test and
never certifies the later runner. Current 39-test logs supersede it. The earlier
fallback-fidelity audit remains a record of PR #4, not evidence for this correction.

Reproduction from the candidate root:

```sh
sha256sum -c docs/audits/evidence/printable-boundary-2026-11-06/source-freeze.sha256
node --test --test-reporter=tap scripts/qualification/printable-boundary.test.mjs
SOURCE_ROOT=/path/to/unchanged-pr4-baseline node --test --test-reporter=tap scripts/qualification/printable-boundary.test.mjs
node --test --test-reporter=tap scripts/qualification/printable-boundary-limits.test.mjs
sha256sum -c docs/audits/evidence/printable-boundary-2026-11-06/source-freeze.sha256
```

## Explicit remaining limits and owners

- **UI completion race:** GeneratorScreen still sets printableGuide/status/loading
  unconditionally after await and does not cancel on child/pack changes, unmount,
  a newer action or selection of the icon fallback. The cache guard does not
  suppress these UI updates. Frontend owner must add and test request lifecycle
  handling before broad race/privacy acceptance. Scope wiring is source-reviewed
  only here; React/StrictMode/account-switch behavior has not been rendered.
- **Old data:** Legacy localStorage entries remain physically present. Product/
  privacy ownership must decide and qualify a targeted cleanup/migration. No
  reading or erasure of actual child data occurred during this work.
- **Image privacy/origin:** Validation still accepts unrelated HTTP(S) origins,
  loopback/private network destinations, and URLs embedding child context; the
  renderer uses them as img.src. Rejecting javascript/non-raster data/credentials
  is not a trusted-origin policy. No demonstration URL was visited. Provider,
  domain, browser loading, export and consent review remain required.
- **Enrichment provenance:** Existing response IDs/pack hash do not bind the
  full request payload or mood/content revision. Current authored steps/warnings
  replace supplied ones, but stale enrichment may still be accepted. A valid
  timestamp is not proof of generation freshness (the 1970 fixture is accepted).
  The five-minute cache expiry does not validate provider freshness.
- **Semantic content safety:** Shape checks do not verify developmental/medical
  claims or prevent adaptation text contradicting authored warnings. Retained
  text/array sizes remain unbounded. Qualified child-content review and provider
  output policy remain separate gates.
- **AI controls:** includeImages=false suppresses returned URLs, not AI text
  requests. Remote pause flags are still loaded once in the screen. No client
  kill-switch, consent rule, provider minimization or cancellation policy changed.
- **Other existing behavior:** The server's eight-activity cap remains; a shorter
  provider result is rejected in favor of the full local fallback. The caller
  still passes ageTier as childAge rather than deriving chronological age from
  DOB. Backend guardian/tenant ownership and account provenance are not established
  by this local cache scope and remain separate integration/privacy gates.

## Canonical and publication gates

The checkout has no node_modules. Canonical TypeScript, lint, Vitest, build,
Deno/Edge/schema, React/StrictMode, browser/mobile, print/export pagination,
performance/memory, `verify` and `verify:full` remain unrun. Node source stripping
is not semantic typechecking. No dependency installation or denied route was retried.
In a prepared, authorized checkout, preserve the lockfile and use pnpm 10.30.3:

```sh
pnpm exec vitest run src/lib/printables/guideClient.test.ts src/lib/printables/guideFallback.test.ts
pnpm run verify
pnpm run verify:full
```

Run only configured synthetic/mock acceptance unless a separate live action is
authorized. Add real React account/child change, reload/unmount, repeated create,
icon selection and late-response cases, then rendered browser/mobile print/export
checks. Audit provider/guardian/image boundaries separately.

Read-only remote preflight at the tool-reported timestamp in `remote-preflight.json`
found PR #4 open/draft at `6ce15458`, all-PR search returned only #1–#4, and the
printable branch search plus final empty page found only the original branch.
Exact-head CI run `42269363117` remained `startup_failure`; it supplies no passing
canonical results. No rerun was requested. This observation does not authorize
publication and must be refreshed immediately before any write. Check for a
successor or uncertain write first, reconcile ownership, and retain draft status.

Rollback of this local candidate should preserve PR #4 and the recorded evidence;
reverting to the older persistent cache restores its known privacy/validation
limitations. Do not represent rollback as a safe release solution.

## Next-agent validation handoff

Follow [the detailed agent validation checklist](printable-boundary-validation-handoff-2026-11-06.md).
It lists exact source pins, canonical setup and commands, race/UI/privacy/image
cases, expected evidence and stop conditions. Publication is source preservation,
not permission to merge or deploy, and the known on-screen privacy race remains open.
