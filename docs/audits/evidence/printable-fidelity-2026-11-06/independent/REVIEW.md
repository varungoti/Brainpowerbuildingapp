# Independent printable fallback review

6 November 2026. Scope: the two deterministic fallback builders, their
regressions and supplemental runner. Final source matches every entry in
[`../source-freeze.sha256`](../source-freeze.sha256).

## Disposition

No further introduced defect was found in this bounded scope after one P2
finding was corrected. This is **not full product or release acceptance**.

The initial implementation fed arbitrary `contraindications` entries into
`trim()`. Mixed JSON such as `['First caution.', null, 'Last caution.']`
therefore threw in both paths. The server boundary only checks that
`activities` is a nonempty array, so this was not safely excluded by the
TypeScript declaration. Both builders now check for an array and retain
only string entries before normalizing. Valid warnings survive surrounding
null/number/object entries. Wrong-shape/all-invalid warning collections use
the existing supervision defaults without a new exception.

## Independently executed checks

- Final supplemental runner on Node 24.22.1: **28/28 pass**, zero failures or
  skips. [`candidate.tap`](candidate.tap).
- Same final runner against independently materialized unchanged base
  `836da44bcb96faab395ce2bf15df7d312b4eea63`: **11 pass / 17 fail**.
  [`baseline.tap`](baseline.tap).
- Separate malformed-input probe: [`malformed-check.mjs`](malformed-check.mjs)
  and [`malformed-check.jsonl`](malformed-check.jsonl). It records observed
  results/errors rather than asserting each observation. It verifies the
  warning finding and also records unchanged instruction-default behavior.
  Existing client missing/null-instruction errors are not repaired by this
  warning/valid-authored-instruction slice.
- All four frozen hashes matched; `git diff --check` passed.

The independent rerun uses the same supplemental assertions as the primary
runner. Do not add their counts. TAP receipts have only trailing whitespace
normalized. The probe can be repeated from the repo root with:

```sh
node docs/audits/evidence/printable-fidelity-2026-11-06/independent/malformed-check.mjs "$BASELINE_ROOT" "$PWD"
```

`BASELINE_ROOT` must contain the two exact unchanged source files and module
configuration. Network is disabled and server provider/schema dependencies
are stubbed. No provider, credential, real child data or deployment action
was used.

## Unrun and unchanged limits

Canonical Vitest/typecheck/lint/build, Deno/Edge runtime, browser/mobile and
rendered-print/full acceptance remain unrun. Longer cards need page-break
inspection. AI-generated normalization and previously cached guides can
still omit warnings/steps; this PR only fixes newly built deterministic
fallbacks. Other malformed activity fields, guardian authorization, content
quality and qualified safety review are outside this narrow change.
