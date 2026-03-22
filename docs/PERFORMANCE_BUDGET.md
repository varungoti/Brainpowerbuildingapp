# Performance Budget

These are the current repo-local working budgets for NeuroSpark web delivery.

## Targets

- Initial app shell JS entry chunk: under `260 kB` gzip-unminified equivalent is not used; track the built entry artifact size trend instead.
- Largest lazy screen chunk: under `100 kB`
- CSS bundle: under `140 kB`
- Time-sensitive interactions:
  - generator config to results: keep perceived wait intentional and under the current 2.2s animation window
  - tab/screen changes: no blocking full-screen blank state beyond the suspense fallback

## Current observed build snapshot

From the latest `pnpm run verify`:

- `dist/assets/index-*.js`: about `240 kB`
- `dist/assets/vendor-*.js`: about `297 kB`
- `dist/assets/charts-*.js`: about `218 kB`
- `dist/assets/BlueprintDocsScreen-*.js`: about `90 kB`
- `dist/assets/index-*.css`: about `125 kB`

## Rules of thumb

- Prefer lazy loading for infrequent screens over inflating the entry chunk.
- Keep optional integrations isolated in their own chunks where possible.
- Treat new heavy charting, animation, or editor libraries as budget exceptions that must justify themselves.
- Use `pnpm run verify` after major UI work and compare emitted bundle sizes.

## Escalation triggers

- Entry chunk exceeds `300 kB`
- CSS exceeds `140 kB`
- A new lazy chunk exceeds `150 kB`
- Any regression causes Playwright onboarding/generator flows to slow perceptibly
