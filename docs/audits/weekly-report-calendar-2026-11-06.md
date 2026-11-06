# Weekly report local-calendar correction

Status: draft source change, not release-qualified. No merge or deployment.

## Requirement and ownership

The existing weekly-report plan maps `weeklyReportData.ts` to seven-day aggregation and requires report bounds and day-by-day activity history: `docs/ULTRA_FEATURES_BLUEPRINT.md` lines 178–221 at base `836da44bcb96faab395ce2bf15df7d312b4eea63` (retained requirement IDs NS-S32-P0040 and NS-S32-P0041). This slice corrects that existing data contract. It does not implement the complete PDF/report roadmap or validate developmental claims.

Reserved ownership remains unchanged: PR #1 owns consent/account/family sync races; PR #2 owns the Razorpay boundary. No changed file overlaps either PR's changed-file list checked on 6 November 2026. No new child information is collected or transmitted. All tests use synthetic families without providers.

## Reproduced defects

1. The report selected a local Monday–Sunday window but serialized its labels through UTC. For the week 30 March–5 April 2026, Los Angeles displayed an end of 6 April; Kolkata displayed a start of 29 March.
2. The scheduler separately converted local week bounds to UTC while retaining the reference time. Its keys could disagree with the report, especially near midnight or in UTC+14.
3. Active days used the stored timestamp prefix, merging or splitting local calendar days around UTC midnight.
4. Seven activities on one day produced “Completed an activity every day this week!” even though only one local day had activity.
5. The report footer called distinct activity days a consecutive streak.
6. A valid date-only Monday imported into a negative-offset timezone was interpreted as UTC midnight (Sunday local) and excluded. Impossible date-only values could roll forward into a valid date.

## Change

- `reportCalendar.ts` provides local date keys, calendar-based Monday–Sunday bounds, and validated local parsing of strict `YYYY-MM-DD` values. Timestamp values retain JavaScript instant parsing. Invalid reference dates fail explicitly rather than counting arbitrary logs.
- `weeklyReportData.ts` uses the same parsed local calendar date for inclusion and distinct-day counting, requires all seven distinct days for the daily highlight, and returns local week keys.
- `reportScheduler.ts` shares the same calendar helper so newly recorded report keys match prompt keys.
- The footer says “active days this week.” The legacy `streakDays` field remains for compatibility, with its real meaning documented.
- No score formula, clinical claim, DOB age calculation, authorization, consent, payment, network route, storage schema, dependency manifest or lockfile is changed.

Timezone policy remains the device timezone at report generation. A historical log has no recorded zone, so this cannot reconstruct the original local day after travel. Existing UTC-shifted history keys are not migrated: an already generated report may receive a one-time local prompt. This does not send a report or change persisted data by itself. A reviewed migration belongs to a later persistence slice.

## Validation record

Exact source and runner hashes are in `evidence/weekly-calendar-2026-11-06/source-freeze.sha256`. Final supplemental execution uses Node 24.22.1 native TypeScript stripping and the real report, scheduler, calendar and competency modules. A narrow resolver adds `.ts` to the actual extensionless imports. No replacement algorithm or library mock is used. Network entrypoints are denied before importing source.

The supplemental runner has 15 checks, repeated in four separate processes: UTC, America/Los_Angeles, Asia/Kolkata and Pacific/Kiritimati. It covers exact week endpoints, Sunday references, same-day/different-UTC-day and adjacent-day/same-UTC-day cases, seven repeated logs versus seven distinct days, incomplete/other-child exclusion, valid/invalid date-only history, leap day, invalid references, spring/fall DST weeks, report/scheduler agreement, and Sunday prompt history. The footer test is a source-text assertion, **not rendered UI validation**. The unchanged baseline failed 3 of 15 checks in UTC and 8 of 15 in each other zone; the candidate passed all 15 in every zone (60/60 repeated executions). Baseline and candidate TAP files record actual outcomes (only trailing whitespace on output lines is normalized); repeated cases are not independent feature coverage.

The canonical files contain 21 cases total: 15 report tests (4 existing plus 11 new), 5 scheduler/calendar tests, and 1 React screen test. These are authored counts, **not passing canonical runs**. The screen test renders the real report screen with a synthetic AppContext and checks generation, active-day copy and recorded bounds.

### Independent review

The separately authored probe and review are preserved under `evidence/weekly-calendar-2026-11-06/independent/`. It passed 42 assertion groups in each of five timezones (210/210 repeated checks), while unchanged baseline controls failed 72/210. Three extended 49-check runs also passed, including Lord Howe half-hour DST. These suites overlap each other and the supplemental runner; do not add their counts. The independent source/test review found no blocking issue in this bounded slice, not a release qualification.

### Blocked canonical execution

`pnpm run verify` and the focused Vitest command were invoked. Both stopped before a test, typecheck, lint or build stage. Available pnpm 11.25.0 attempted automatic dependency setup, then failed with `ENOENT` creating its missing pnpm home directory. Logs are retained in `canonical-verify.log` and `canonical-focused.log`. No dependency install completed, and package/lock files were unchanged. The missing home directory is an environment setup failure, not an access denial. One bounded follow-up used an isolated writable home and a fresh Corepack cache, explicitly disabled Corepack networking, and invoked pinned pnpm 10.30.3. It stopped because that package-manager tarball was not cached (`canonical-isolated-home.log`). The displayed network-disabled error reflects that deliberate offline setting, not a newly observed registry denial. No alternate registry, dependency override or denied-package retry was used.

Canonical dependencies are not installed in this checkout. The prior official frozen-lock install blocker remains unresolved. The repository requires pnpm 10.30.3 and TypeScript 5.8.2. Node 24 supplemental execution is not the repository's Node 20 CI environment. No semantic TypeScript, canonical Vitest/React, lint, build, browser/Capacitor, provider, backend or release pass is claimed.

## Validation handoff

In an authorized prepared checkout with the unchanged lockfile and pinned package manager:

1. Install with `pnpm install --frozen-lockfile`. Stop and report any access denial; do not change the registry or lockfile to obtain a pass.
2. Run the focused canonical matrix in separate processes:

   ```sh
   for tz in UTC America/Los_Angeles Asia/Kolkata Pacific/Kiritimati Australia/Lord_Howe; do
     TZ="$tz" pnpm exec vitest run src/lib/reports/weeklyReportData.test.ts src/lib/reports/reportScheduler.test.ts src/app/screens/ReportScreen.test.tsx || exit 1
   done
   ```

3. Run `pnpm run verify`, then `pnpm run verify:full` for wider release confidence. Do not sum the overlapping matrix and full-suite counts. Record the exact commit, runtime, commands, failures and not-run stages.
4. In a synthetic local browser/native session, generate a report with nonconsecutive activity days, check Monday/Sunday labels, seven same-day logs, the Sunday prompt and repeated generation. Check real timezone and DST behavior, including a midnight boundary and device timezone change. Existing report-history migration and complete report lifecycle are separate gates.
5. Rerun after integration or any changed source. Inspect CI at the published head. A draft PR and supplemental passes are not merge/deploy permission.

To repeat the supplemental qualification without dependencies, use Node 24.22.1:

```sh
TZ=America/Los_Angeles node --test --test-reporter=tap scripts/qualification/weekly-calendar.test.mjs
```

For the negative control, set `SOURCE_ROOT` to an unchanged checkout at the base SHA. The runner imports its report/scheduler/competency modules and reads its screen source.

## Publication and rollback

Publish only this bounded branch and draft PR. Main remains unchanged. Read-only publication checks found no Vercel project linked to `varungoti/Brainpowerbuildingapp`; inspected repository Supabase and marketing deploy workflows are main/master gated and this change does not match their paths. Do not manually dispatch workflows or deploy.

Rollback is closing the unmerged draft. If integrated later under separate approval, revert the bounded code/test commit, then revalidate. Other report gaps, privacy/consent/billing PRs, provider/device acceptance and product release gates stay open.
