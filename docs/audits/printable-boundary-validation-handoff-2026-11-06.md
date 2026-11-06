# Printable boundary validation handoff

Status: bounded implementation independently source-reviewed; integration and
release acceptance incomplete. Keep the PR draft. This work follows PR #4 at
`6ce15458a3bc56b22920af86f1efcbd67e1d228a`; do not alter that PR or duplicate the
boundary correction. Read the current PR and branch before continuing.

## Scope to preserve

The client explicitly projects requests, snapshots in-flight input, validates
response/cache shapes and binds authored steps, materials and warnings to the
current request. Printable caching uses no localStorage/sessionStorage. One
validated guide and exact request identity are retained in an explicit in-memory
screen/account/child scope for five minutes, with cleanup invalidation and
last-started-request fencing. New request scopes never go to the provider.

The source freeze is
`docs/audits/evidence/printable-boundary-2026-11-06/source-freeze.sha256`.
Review is in the sibling `independent/REVIEW.md`. Verify every pin first; if any
source has changed, assess the delta and rerun/review its affected evidence.

## Reproduce existing evidence without network

Use Node 24.22.1 for these supplemental runners. Repository CI currently uses
Node 20; these supplemental Node 24 results do not stand in for CI or TypeScript.

```sh
sha256sum -c docs/audits/evidence/printable-boundary-2026-11-06/source-freeze.sha256
node --test --test-reporter=tap scripts/qualification/printable-boundary.test.mjs
node --test --test-reporter=tap scripts/qualification/printable-boundary-limits.test.mjs
node --test --test-reporter=tap docs/audits/evidence/printable-boundary-2026-11-06/independent/independent.test.mjs
```

Expected: 39 regression passes; five demonstrated known limitations; seven
additional independent probes. Do not add overlapping totals. The limit probes
are expected to pass by observing risky behavior, not by proving it safe.
For the baseline control, materialize unchanged guideClient, guideFallback and
guideTypes from PR #4's exact head in a separate temporary tree, then run the
same regression runner with SOURCE_ROOT set to that tree. Expected baseline:
eight pass, 31 fail. Never replace the working candidate with baseline files.

## Canonical checks still required

The authoring checkout had no node_modules. No canonical TypeScript, ESLint,
Vitest, build or React/browser execution was performed. Use a prepared authorized
checkout, retain pnpm-lock.yaml and pnpm 10.30.3, and respect any previous package
access denial. Do not retry a denied dependency URL, switch registries to evade
it, loosen lockfile safeguards or install unrecognized software. Record exact
setup and runtime versions; stop and report an access/setup blocker.

```sh
pnpm exec vitest run src/lib/printables/guideClient.test.ts src/lib/printables/guideFallback.test.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run verify
pnpm run verify:full
```

The client file has 31 authored Vitest cases, not a passing canonical result.
Record each stage as passed, failed, blocked or never run. `verify:full` includes
Playwright, paywall and admin checks; use the existing synthetic/mock setup, no
real payments, account changes, external provider calls or private child data.

## Required UI/account/race scenarios

Use synthetic owners, children and activity packs and a controllable mock fetch.
Test the rendered GeneratorScreen under React/StrictMode, not just extracted
functions. Record expected screen, cache and loading state separately.

1. Repeated creation within one account/child and five minutes: matching cached
   request is reused; authored-content or mood changes invalidate it.
2. Account A to B with identical child name/content, child A to B within one
   account, logout/login, unmount/remount and reload: no cross-scope cache reuse.
   Confirm effect cleanup runs and a suspended/resumed tab rejects expired data.
3. Start older then newer remote work. Resolve success/failure in both orders,
   including a changed pack/mood. Newer cache wins. **Known unfixed:** the screen
   currently applies old results/status/loading unconditionally. Reproduce and
   address that as a separately reviewed lifecycle correction before acceptance.
4. While a request is pending, switch account/child, generate a different pack,
   navigate away/back or choose the offline icon guide. **Known unfixed:** old
   results can still overwrite the visible selection; an existing displayed guide
   is not cleared merely by the new cache scope. Do not report privacy complete.
5. Expiry while newer work is pending, cleanup followed by reuse, and two scopes
   in parallel: eviction/cleanup must not revive old work or cancel another scope.
6. Confirm five-minute cache expiry is not presented as erasing active request
   closures, visible React state or historical persistent data.

## Privacy, provider and content gates

- Old printable localStorage entries remain physically present and are ignored.
  A targeted cleanup/migration needs a documented decision and separate tests;
  this candidate is not proof of erasure. Avoid inspecting real family data.
- Current image validation permits arbitrary HTTP(S), loopback/private origins
  and URLs containing child context. Establish a reviewed origin/consent policy
  and test browser/PDF loading with mocks. Do not visit probe URLs or transmit
  child context. Scheme filtering alone is not a privacy boundary.
- includeImages=false is not a text opt-out. Pause flags are fetched once; client
  cancellation, dynamic kill-switches, guardian consent and provider minimization
  remain unqualified. Do not broaden these policies silently.
- Provider response IDs/legacy pack hashes do not authenticate full request
  identity. Stale enrichment can survive a changed mood/authored revision while
  current steps/warnings are rebound. Define and test provenance/freshness and
  text/array limits before claiming trustworthy provider output.
- Shape validation cannot prove developmental appropriateness, medical-claim
  safety or that adaptations respect warnings. Use qualified content review.
- Existing caller passes ageTier as childAge, and the server caps output at eight
  activities. Test documented full local fallback for larger packs and treat
  accurate age mapping/server parity as separate requirements.

## Print, device and integration gates

Verify supported Deno/Edge/schema behavior in an authorized mock environment.
Exercise browser and Capacitor/mobile rendering, offline fallback, long authored
steps and multiple safety warnings, image absence/failure, non-Latin names,
print/PDF pagination, repeated export, browser back/forward and interrupted
flows. Check content is neither truncated nor misleading. Measure relevant
memory/timer behavior; do not infer it from the source-level timer tests.

## Publication and continuation rules

Before any write, inspect exact remote branch/PR state and potential successor
work. Verify a failed or uncertain write rather than blindly retrying. Preserve
PR #4, unrelated changes, locks and current ownership. Include only authorized
source, technical plans and synthetic evidence. Exclude credentials, private
customer data and private conversation notes.

If a newly discovered code defect is authorized for implementation, use a coherent
follow-up and renewed exact-source tests/review. Obtain separate approval for
credentials/access changes, fees, real transactions, merge or deployment. Do not
change deployment triggers, security settings or use a prohibited network route.

The final validation report should include exact commit/tree, source hashes,
commands, runtime versions, pass/fail/blocked/unrun stages, screenshots or print
artifacts when relevant, reproduced known risks and remaining owner decisions.
A green limited suite or source review is not release readiness.
