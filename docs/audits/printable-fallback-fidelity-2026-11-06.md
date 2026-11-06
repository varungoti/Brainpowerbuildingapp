# Printable fallback fidelity: plan and qualification

Date: 6 November 2026. Base: `836da44bcb96faab395ce2bf15df7d312b4eea63`.
Status: bounded source correction; **draft, not release-ready**.

## Requirement and ownership

This slice advances consolidated requirements NS-S51-P0004 (useful offline
printable guidance), NS-S51-P0008 (safe materials and supervision),
NS-S53-P0006 (printable steps and safety notes) and NS-S53-P0010
(deterministic fallbacks). The corresponding pinned repository sources are
[`memory-bank/productContext.md`](../../memory-bank/productContext.md) and
[`memory-bank/projectbrief.md`](../../memory-bank/projectbrief.md). It is a
partial implementation/evidence checkpoint, not closure of child-safety,
printable consistency or clinical/content review requirements.

On 6 November the remote main remained at the base above. Changed filenames
of open drafts #1 (consent/family ownership), #2 (Razorpay acknowledgement)
and #3 (weekly calendar) were checked. This slice has no changed-file overlap
with those PRs, and does not incorporate or alter their branches. A separate
checkout preserves the staged work in the weekly-calendar checkout.

Implementation owner: this printable-fallback branch. Independent review
owns the separately recorded review evidence. Release/merge/deployment and
qualified content acceptance remain owner gates.

## Root cause and bounded change

Both `src/lib/printables/guideFallback.ts` and
`supabase/functions/server/printable_guide.ts` used `slice(0, 7)` for authored
instructions and only `contraindications[0]` for safety. Later setup, play or
cleanup steps were dropped. Later warnings were also dropped; a blank first
warning could suppress all useful safety copy. Catalogue enrichment in
`src/app/data/activities.ts` already permits multiple warnings through
`inferContraindications`.

Both deterministic builders now:

- Copy every authored instruction in order, without truncating at seven.
- Accept warning arrays, discard non-string entries, then trim and retain
  every nonblank warning in order, joining them into the existing string field. Exact duplicate warnings are emitted once.
- Keep their existing generic supervision text when no nonblank warning exists.
- Preserve their existing types, IDs, hash behavior, metadata, and server
  optional-instruction defaults. Source instruction arrays are not aliased.

No external provider call, endpoint, model/schema contract, consent, authorization,
storage format, package manifest, lockfile or UI component changed. Fixtures
are synthetic and no real family data was used. This change preserves
provided instructions; it does not validate their developmental or safety
content and does not claim to make arbitrary input safe.

## Plan and measured status

1. Reconcile master requirements, main, PR ownership and affected callers:
   **done** for this bounded slice.
2. Reproduce the loss on unchanged main: **done**, supplemental suite fails
   17 of 28 tests, with 11 passing.
3. Correct both deterministic builders and add client regression cases:
   **done** in the frozen candidate.
4. Run feasible source qualification and independent review: candidate
   supplemental suite **28/28 passed**; independent re-review found no further
   introduced defect in this scope after the malformed-warning fix. See
   [review and receipts](evidence/printable-fidelity-2026-11-06/independent/REVIEW.md).
5. Run canonical tests, rendered-print QA and full release gates: **not run**,
   pending a prepared authorized checkout and the checks below.
6. Publish only as a draft with remaining gates: publication receipt is
   recorded in the pull request. No merge or deployment is authorized here.

## Executed evidence

Runtime: Node `v24.22.1`, native TypeScript stripping. Command from the repo root:

```sh
node --test --test-reporter=tap scripts/qualification/printable-fidelity.test.mjs
```

The runner imports both exact source modules. It substitutes only the
server's provider and schema dependencies: the text provider returns null,
image generation throws if called. TCP/TLS, HTTP(S), and fetch are disabled.
The provider-null generation probe explicitly disables images. This does
not test provider behavior, schema validation, Deno or deployed endpoints.

Twenty-six checks cover the two fallback builders' instruction completeness
and copying, complete ordered warnings, blank-first and empty warning cases,
trimming/deduplication, malformed collections and entries, non-Latin text,
per-activity isolation, source immutability and basic metadata. Two server checks cover missing-instruction
defaults and provider-null generation. Baseline and candidate use identical
fixtures and assertions.

Receipts:

- [`baseline.tap`](evidence/printable-fidelity-2026-11-06/baseline.tap):
  unchanged base, exit 1, 11 pass / 17 fail.
- [`candidate.tap`](evidence/printable-fidelity-2026-11-06/candidate.tap):
  candidate, exit 0, 28 pass / 0 fail / 0 skip.
- [`source-freeze.sha256`](evidence/printable-fidelity-2026-11-06/source-freeze.sha256):
  hashes of both source files, canonical client test file and supplemental runner.

The first 22-case revision passed on the initial candidate. Independent
review then found a malformed-warning regression introduced by trimming
unvalidated entries. Both builders now check collection and entry shapes,
and six added supplemental checks cover that finding. The retained baseline
and candidate receipts are fresh 28-case runs of the same final runner; the
baseline files were materialized directly from the unchanged Git base. No
failed install or denied route was retried.

`git diff --check` passed for the implementation/test diff. The canonical
client file now contains thirteen Vitest cases (two existing plus eleven new).
**Thirteen authored cases are not thirteen passing canonical results.** Supplemental
and future canonical suites overlap; do not sum their counts.

## Canonical and release gates still open

The isolated checkout has no `node_modules`, Vitest, TypeScript or ESLint
installation, and Deno is not installed. No canonical command was executed
and no package download/install was attempted for this slice. Earlier
dependency access restrictions were not retried or bypassed.

In an authorized prepared checkout, retain `pnpm-lock.yaml` and use the
project's pinned `pnpm@10.30.3`:

```sh
pnpm exec vitest run src/lib/printables/guideFallback.test.ts
pnpm run verify
pnpm run verify:full
```

Before `verify:full`, prepare approved mock-only Playwright/admin dependencies;
its admin command contains installation steps. Do not use that aggregate to
retry a known denied dependency download. Record each stage as passed, failed
or not run, against the exact final commit.

Additional acceptance:

- Run the server source under the supported Deno/Edge toolchain with mocked
  providers and no secrets/network. The Node module probe is not Deno
  typechecking or endpoint acceptance.
- Render preview and print/export for short and long multi-activity guides,
  including ten-step cards, several long warnings and non-Latin warnings.
  Check all warnings and steps remain visible across page breaks on intended
  browsers/mobile devices. Existing `break-inside-avoid` and preview overflow
  styling need real rendered inspection, not source-only claims.
- Check a fresh local fallback and a fresh mocked server fallback through
  the full UI, including refresh/failure paths. No real provider calls.
- Independent review is complete; verify remote tree and CI for the final
  published commit. CI failure/startup failure does not count as acceptance.

## Explicitly unfinished adjacent work

- Existing cache keys do not include instructions or safety notes. This PR
  does not invalidate or migrate previously cached incomplete guides. The
  correction applies to newly built fallback objects, not old cache entries.
- AI-generated normalization can replace fallback steps/warnings. Generated
  results and persisted cache payloads are not validated by this PR. Their
  identity, shape, warning retention and freshness need a separate tested
  boundary correction before claiming end-to-end printable safety.
- The server still limits packs to eight activities. The generated schema's
  step limit is unchanged. Neither is silently presented as resolved here.
- Content/material safety, unsupported developmental copy, guardian/data
  minimization, and production provider/device behavior remain distinct
  acceptance and approval gates.

Next authorized source slice: test and reconcile printable response/cache
validation and safety-note retention with synthetic fixtures, preserving
current ownership and separate provider/data/security permissions.

## Publication preflight and rollback

Read-only preflight found zero accessible Vercel projects linked to this
repository URL. Inspected Supabase deployment workflow triggers only on
main/master pushes or manual dispatch; marketing deployment is main-gated;
Android build is main/master/tag/manual-gated. No workflow, provider or
deployment was manually invoked or configured. PR-triggered CI may run its
existing checks.

Rollback is to close the unmerged draft or revert the bounded change through
normal review. No database migration, storage mutation or external action
requires rollback. Do not merge or deploy merely because source publication
and this supplemental suite succeeded.
