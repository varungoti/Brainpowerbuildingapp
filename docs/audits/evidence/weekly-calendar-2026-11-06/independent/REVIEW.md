# Independent review: weekly report local calendar

Review date: 2026-11-06
Repository: varungoti/Brainpowerbuildingapp
Baseline: 836da44bcb96faab395ce2bf15df7d312b4eea63
Verdict: No blocking source-code finding in the bounded calendar correction. This is not a release qualification, merge approval, or deployment approval.

## Source and test review

Reviewed reportCalendar.ts, weeklyReportData.ts, reportScheduler.ts, the ReportScreen footer, and their authored canonical tests. The correction consistently uses the viewing device's local Monday-Sunday calendar for report bounds, labels, day counts, and scheduler keys. Valid strict date-only values keep their local calendar meaning, impossible date-only values are rejected, and timestamps retain instant parsing. Seven activities on one day no longer claim seven days. The footer correctly describes distinct active days rather than a consecutive streak.

The helper uses calendar arithmetic rather than fixed 24-hour durations. Week-edge milliseconds, Sundays, leap/year boundaries, DST transitions, incomplete activities, other-child exclusions, unchanged reference Dates, and competency-tag counts were checked using synthetic fixtures. No source, lockfile, app state, real child records, provider data, or remote state was changed by the reviewer.

The exact reviewed source and authored test hashes are in source-sha256.json. Canonical tests were inspected, not executed. The independent probe uses actual source modules with Node 24.22.1 native TypeScript stripping; it does not typecheck or render React. Network entrypoints are denied in the probe. The baseline mode loads pinned git objects with lazy fetching disabled.

## Independent executable evidence

The same 42 assertion groups were run per timezone in separate processes. Repeated matrix cases are not separate feature coverage.

| Timezone | Candidate passed | Baseline passed | Baseline failed |
| --- | ---: | ---: | ---: |
| UTC | 42/42 | 39/42 | 3 |
| America/Los_Angeles | 42/42 | 23/42 | 19 |
| Asia/Kolkata | 42/42 | 27/42 | 15 |
| Pacific/Kiritimati | 42/42 | 22/42 | 20 |
| Australia/Lord_Howe | 42/42 | 27/42 | 15 |

Candidate: 210/210. Negative control: 72/210 assertions fail on the unchanged baseline, including the daily-highlight bug even in UTC. Baseline processes intentionally exit 1; candidate processes exit 0. Per-zone JSON files preserve the actual failing assertion names and expected/actual results.

Additional extended runs add the week containing Lord Howe's October 2026 half-hour DST change: 49/49 passed each in Australia/Lord_Howe, America/Havana, and Asia/Beirut. The normal matrix already includes Lord Howe's April transition. These overlap the primary matrix and must not be presented as independent feature counts.

The implementer's separate 15-test supplemental runner was also independently executed in America/Los_Angeles: 15/15 passed. Its footer assertion is source-only, not rendered UI validation. A final git diff --check was clean.

## Limits and next gates

Canonical Vitest/React, semantic TypeScript, lint, build, browser/native and full release checks remain unverified. Dependency setup is unavailable; the review did not retry blocked downloads or use alternate dependencies. The implementation audit records exact setup failures and the required canonical timezone matrix. Run the unchanged-lockfile/pinned-toolchain checks and inspect CI at the published commit before treating this as qualified.

Device-timezone grouping intentionally cannot recover the original local day after travel because that timezone is not stored. Old shifted report-history keys are not migrated, so a one-time prompt may recur. DOB age logic, full report lifecycle, claims, consent, billing and providers remain outside this patch.

## Reproduction

From the evidence directory, set SOURCE_ROOT to the candidate checkout:

```sh
SOURCE_ROOT=/path/to/checkout TZ=America/Los_Angeles node independent-weekly-calendar-probe.mjs
SOURCE_ROOT=/path/to/checkout SOURCE_REVISION=836da44bcb96faab395ce2bf15df7d312b4eea63 TZ=America/Los_Angeles node --disable-warning=ExperimentalWarning independent-weekly-calendar-probe.mjs
SOURCE_ROOT=/path/to/checkout EXTENDED=1 TZ=Australia/Lord_Howe node independent-weekly-calendar-probe.mjs
```

Probe SHA-256: 0b19aac2cf4b890d44b181779551b63398c1e68b217d43978b512ef74f839174
