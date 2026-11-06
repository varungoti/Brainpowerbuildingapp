# Agent validation runbook: printable UI lifecycle

Keep this draft. No merge, deploy, live provider, payment, account, consent,
credential, security-setting, customer-data or model-download action is covered.
Use synthetic owners/children/packs and controlled mock networking throughout.

## 1. Verify state and ownership before doing work

1. Read this PR, parent #5 and any newer successor. Confirm the base remains the
   intended exact commit `cb05f2559e9b447c29ec71bfd419b1e51cd5a0eb` and reconcile
   any newer changes before running or publishing. Do not alter PRs #1–#5.
2. Inspect repository instructions, clean/dirty work and locks. Preserve unrelated
   work. Record commit/tree, branch, date/time and platform.
3. Run the source freeze check below. A mismatch requires review and refreshed
   tests, not a silent manifest rewrite.

```sh
sha256sum -c docs/audits/evidence/printable-ui-2026-11-07/source-freeze.sha256
git diff --check
```

## 2. Locked canonical environment and tests

Use an authorized prepared environment with pnpm 10.30.3 and dependencies matching
pnpm-lock.yaml, including React/ReactDOM 18.3.1 and TypeScript 5.8.2. Do not replace
or relax the lockfile, use mirrors to bypass denial, or retry the previously denied
node-releases@2.0.36 HTTP 403 route without new authorization. Stop and report an
unavailable dependency/runtime or denied route. No desktop quota probe is needed.
Record versions first. Do not interpret a package-manager startup error as tests
having run.

```sh
node --version
pnpm --version
pnpm exec vitest run src/lib/printables/usePrintableGuide.test.tsx src/app/screens/GeneratorScreen.printables.test.tsx src/lib/printables/guideClient.test.ts src/lib/printables/guideFallback.test.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run verify
```

The new TSX tests explicitly select jsdom and exercise StrictMode. The screen test
mocks app context, flags, analytics, activity selection and preview rendering;
these focused passes do not validate the real app context or printed DOM.

Once the above passes, inspect the configured acceptance scripts and ensure all
provider, payment and account flows are synthetic before running:

```sh
pnpm run verify:full
```

`verify:full` invokes Playwright, paywall and admin tests. Its admin script also
invokes dependency/browser installation; run only in an authorized prepared setup
that avoids denied routes and unexpected downloads. Do not configure secrets,
change security settings, use real payments or send real child data to make it
pass. Record which stage ran, failed, was blocked, or was never attempted.

## 3. Supplemental reproduction without installation

The author's already-installed toolchain differed from the lock. It yielded
95/95 focused tests on React 19.1.0/Vitest 4.1.12/jsdom 25.0.1 using Node 24.22.1.
The configuration performs no installation. If using this supplemental route,
set TOOLCHAIN to a verified, authorized existing directory containing node_modules,
then execute from the candidate repository root:

```sh
export PRINTABLE_TEST_TOOLCHAIN="$TOOLCHAIN"
node "$TOOLCHAIN/node_modules/vitest/vitest.mjs" run src/lib/printables/usePrintableGuide.test.tsx src/app/screens/GeneratorScreen.printables.test.tsx src/lib/printables/guideClient.test.ts src/lib/printables/guideFallback.test.ts --config scripts/qualification/printable-ui.vitest.config.mjs --reporter=verbose
node --test --test-reporter=tap scripts/qualification/printable-boundary.test.mjs
node --test --test-reporter=tap scripts/qualification/printable-fidelity.test.mjs
```

Expected focused cases: hook 34, screen 17, client 31, fallback 13. Node suites:
boundary 39 and fidelity 28. Counts overlap. These do not replace canonical
verification, semantic typechecking, real browser/native tests or provider QA.

For the negative control, materialize unchanged PR #5's exact tree in a separate
checkout. Copy only the new screen test and the three printable-ui supplemental
configuration/setup/stub files into that baseline. From that baseline directory,
run just GeneratorScreen.printables.test.tsx with the supplemental config. Expected:
3 pass, 14 fail. Never overwrite candidate production files with baseline source.
Do not count failed test discovery/configuration as reproduced regressions.

## 4. Required actual-app interaction matrix

Use controllable mock fetch promises, synthetic app contexts and a browser/network
allowlist that prevents external provider or image requests. Record visible guide,
status, button loading and cache state separately.

- Success, rejected fetch, invalid response and unexpected client rejection.
  Current failures yield the existing offline guide and release loading.
- Older/newer requests, both completion orders, each failing/succeeding. A late old
  success/failure/finally must not change newer guide/status/loading/cache. Exercise
  queued React updates in one batched event as well as separate events.
- Change local owner ID, authenticated UID, child ID, child name, age tier, mood,
  authored steps and authored warnings while idle, displaying, or pending. Equal
  child names/content must not make different account/child scopes interchangeable.
- Observe the first changed render before layout/passive effects, not only the
  settled DOM. It must never expose an old guide/status/loading value.
- Logout/login, A→B→A, close/reopen, generating/result transitions, unmount/remount,
  reload, browser back/forward and StrictMode cleanup/setup.
- Generate a different pack while the previous guide is pending; then initiate a
  newer guide. Old work must not refill cache or replace the new pack's guide.
- Same-context regeneration keeps the existing matching guide and actions while
  showing loading. Both Icons only and Use simple icon version must work while
  pending. Late success/failure cannot replace the icon guide or refill its cache.
- Icons alone must not fetch. Changed context or rerender alone must not fetch.
  Same-value rerender must not cancel valid pending work. Matching cache reuse
  within five minutes must not fetch. Scope changes/close must clear reuse.
- Test the actual AppContext account/child and generatedPack lifecycle separately.
  A stale activity pack can remain after account change in current code. This PR
  does not establish its provenance; coordinate any correction with PR #1.
- Test suspended/resumed tabs, expired caches and two screens/scopes independently.
  Confirm TTL is not advertised as erasure or cancellation of already-sent work.

## 5. Print, device, privacy and release gates

Render the real PrintableGuidePreview and export controls with long/multiple
warnings, images absent/failing, multilingual text and multiple activities.
Check browser print/PDF/download pagination, repeated export, mobile/Capacitor,
keyboard/screen-reader behavior, loading indication and memory/performance.
Use synthetic images without fetching arbitrary provider URLs.

Revisit the parent handoff's image-origin/provenance, freshness, semantic safety,
text bounds, guardian ownership, provider minimization, remote pause, accurate age
and server-cap gates. No UI-token test closes those separate requirements.

## 6. Evidence, publication and stop conditions

Return a report with exact commit/tree and hashes; each command, runtime,
pass/fail/blocked/unrun status; negative-control results; independent review;
screenshots/print artifacts for actual rendered acceptance; and remaining risks
and next owners. Distinguish supplemental and locked results.

Before a new authorized publication, inspect PR/branch state, leases, possible
successors and hosting triggers. Check uncertain writes rather than retrying.
Stop for source drift, ownership overlap, new access/security/credential/fee or
legal requirements, real data/provider use, denied routes or unapproved deployment.
Keep the PR draft until all applicable acceptance gates and owner approvals exist.
