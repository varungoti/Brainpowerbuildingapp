# Printable visible-state lifecycle correction

Status: independently reviewed bounded draft candidate. Not release-ready.

This is a bounded successor to PR #5 at
`cb05f2559e9b447c29ec71bfd419b1e51cd5a0eb`, tree
`9c81f91e51ffaf15a331fd60c8fc6fd593e1ed33`. The isolated local baseline was
verified tree-identical before editing. Parent PRs #1–#5 are unchanged.

## Requirements, root cause and scope

The consolidated product requirements NS-S51-P0004 and NS-S54-P0013 call for useful
printable guides and provider-independent deterministic packs. PR #5's validation
handoff explicitly leaves unconditional stale screen completions and old displayed
account/child state unresolved. Its cache fencing does not protect React state.

GeneratorScreen previously applied every completed guide, catch fallback and
finally/loading update, even after a different account/child, pack, mood, or view
became active. Changing cache scope did not clear an already visible guide.
Synthetic rendering of the unchanged PR #5 demonstrates these defects. This is
not evidence of a production disclosure or use of real family information.

This slice owns only printable visible-state lifetime and its existing caller.
It does not repair underlying family/pack provenance, alter consent or provider
policy, cancel server work, or change content validation.

## Implemented behavior

- The new `usePrintableGuide` hook binds guide, status and loading state to the
  account/child cache scope, full projected request revision and active view.
- Render-time masking hides obsolete guide/status/loading before cleanup effects
  run. A layout effect retires the prior view, drops stored state and clears the
  existing scoped cache on context changes, view close and unmount.
- A last-started operation token fences success, rejected-client fallback and
  loading completion. Functional updates also check the current operation.
- Same-context regeneration retains the matching previous guide and actions while
  showing loading, preserving the original screen behavior. Older completions
  cannot replace newer results or clear a newer pending request's status/loading.
- Both icon controls remain usable while remote work is pending. Choosing icons
  invalidates that pending UI/cache work and creates the existing local fallback.
  It makes no new provider request. It does **not** abort or recall requests
  already sent, or undo provider processing or cost.
- Guide client, request projection/validation, fallback builders, cache size/TTL,
  provider payload/endpoint, settings, dependencies and lockfile are unchanged.
  Account identifiers, local contexts and operation tokens are not transmitted.

Changes are limited to GeneratorScreen, PrintableActions and the new hook, plus
synthetic tests, a supplemental test configuration and technical evidence.

## Executed evidence

Source/test freeze: `evidence/printable-ui-2026-11-07/source-freeze.sha256`.

An already installed isolated toolchain executed real React/StrictMode and jsdom
rendering without installing packages or using the denied dependency route:

- **95/95 focused Vitest cases pass:** 34 new hook cases, 17 new screen cases,
  inherited 31 guide-client cases and 13 fallback cases.
- The exact same 17 screen cases on unchanged PR #5 yield **3 pass, 14 fail**.
  Failures cover retained displayed account/child state, late success/failure and
  catch fallback, pack replacement/loading, and disabled pending icon choices.
- Supplemental exact-source Node suites repeat **39/39 boundary** and **28/28
  fallback fidelity** passes. These overlap the Vitest assertions; do not sum.
- Outbound fetch defaults and TCP/TLS/HTTP entrypoints are blocked in the test
  worker. Only the controlled synthetic printable endpoint fixture is used.
  Unrelated app context, analytics, remote flags, activity selection and preview
  markup are mocked. Actual guide client, cache, validation and fallback run in
  these focused tests. Confetti is an explicit fail-if-called stub.
- Logs are in the evidence directory; final blank lines are normalized only. Earlier exploratory configuration and
  fixture corrections are not passing evidence. `focused-candidate.txt` is the
  final 95-case run on the reviewed source freeze.

Runtime: Node 24.22.1; React and ReactDOM 19.1.0; Vitest 4.1.12; Vite 6.4.4;
jsdom 25.0.1; Testing Library React 16.1.0; installed TypeScript 5.9.3; esbuild
0.25.12. TypeScript was **not** semantically checked by these transpiled runs.

These are **noncanonical** rendering/test results: this project locks React
18.3.1, Vite 6.3.5 and TypeScript 5.8.2 with pnpm 10.30.3. No claim is made that
its locked toolchain, complete app context, browser/native devices, printing,
provider integration or production behaves identically.

## Independent review

A separate read-only reviewer repeated the final 95/95 candidate and 3-pass,
14-fail baseline results and verified the eight frozen source/test/config hashes.
No new blocking defect was found in this bounded slice. See the accurately
attributed [review summary](evidence/printable-ui-2026-11-07/independent/REVIEW.md).
The reviewer saved no independent log files; author receipts are not represented
as independent logs. The inherited cross-child pack risk remains an open gate.

## Remaining acceptance gates and owners

The implementing/reviewing agent must use the linked validation runbook to repeat
all changed-source tests under the locked dependencies, run canonical typecheck,
lint, complete tests/build and synthetic end-to-end acceptance. The checkout has
no complete node_modules and its available pnpm is 11.25.0. Earlier installation
was denied at official node-releases@2.0.36 with HTTP 403. This work did not retry
that package, switch registry, bypass lockfiles, install packages or probe a
quota-limited desktop. Canonical verification remains blocked/unrun here.

Owner/qualified reviewers still need to resolve provider/content/guardian policy
and release acceptance. Publication as a draft only preserves reviewed source
and evidence; it does not complete these gates or authorize merging/deploying.

## Known limits outside this slice

- The activity pack's own delayed runAGE timer, local `pack` state and app-level
  generatedPack/family ownership are not repaired. In particular, account change
  may leave the existing activity pack on screen. A new guide explicitly created
  afterward uses that current screen pack; this change does not prove the pack
  belongs to that child/account. Coordinate with consent/ownership PR #1 rather
  than claiming a complete account-data boundary.
- Visible guide expiry, old persistent entries and pending provider closures are
  not secure erasure. The existing five-minute cache TTL does not remove a guide
  currently displayed in the same active view.
- Provider requests already sent continue. Selecting icons, leaving the view or
  changing context suppresses their UI/cache effects only. There is no new
  AbortController, dynamic kill-switch or consent enforcement.
- The screen still loads remote pause flags once. includeImages=false does not
  opt out of AI text. ChildAge remains derived from ageTier, and the server's
  eight-activity cap remains.
- PR #5's arbitrary HTTP(S) image origin, enrichment freshness/provenance,
  unbounded text/array and semantic safety limitations remain. Shape validation
  is not qualified child-content or clinical review.
- Print/export DOM layout, title/HTML export escaping, preview image behavior,
  browser/Capacitor operation, accessibility and performance remain unqualified.
- Same-context regeneration preserves the previous matching guide until a newer
  result or icon selection. This is intentional; it is not proof of remote
  enrichment freshness.

## Publication and rollback

Before publication, refresh PR #5's exact head, all PR/branch ownership and hosting
triggers. Stop on overlap, changed base, uncertain write, denial or new risk.
Create a new draft branch/PR stacked on PR #5, not main; do not edit #1–#5.
Source, technical plan and synthetic evidence only. No secrets, customer data or
private conversation material. No workflow dispatch, merge, deployment, security
change or external provider action.

Rollback is a source revert, not a safe release state: it restores the documented
stale printable response/display defects. Preserve the parent cache/validation
fix and evidence.

Read [the exact validation handoff](printable-ui-validation-handoff-2026-11-07.md)
before continuing or making any readiness claim.
