---
name: nurospark-evidence-review
description: Review NuroSpark cloud-sync consent, guardian scope, adult-led synthetic UX and nonclinical claim evidence before a bounded handoff. Use when editing or reviewing cloudSync, weeklyReportData, competency copy, or their test/release records. Does not authorize child-data processing, provider use, installation or deployment.
---

# NuroSpark bounded evidence review

This original project-specific review workflow adapts selected reference ideas from the reviewed seven-tool plan. It installs no upstream package, hook, browser adapter or memory store. Start with [the project contract](references/review-contract.md) and the checkout's current instructions.

## Required workflow

1. Record the exact checkout/branch/SHA, current dirty-file disposition and one owner for every changed path. The dated inspected main is `836da44bcb96faab395ce2bf15df7d312b4eea63`; recheck it before applying this snapshot to later code. Preserve consent PR1 and payment PR2 as separate candidates. A changed baseline or unresolved owner blocks conclusions about that candidate.
2. Review `src/lib/sync/cloudSync.ts` with `src/app/context/AppContext.tsx` and `src/components/sync/CloudSyncCard.tsx`. Preserve their combined operation-token contract when reviewing PR1. Distinguish cancellation before dispatch from data already transmitted. Do not call a child account, real cloud service or provider.
3. Review `src/lib/reports/weeklyReportData.ts` and competency/milestone copy using [the claim-appraisal checklist](references/review-contract.md#claim-appraisal). Activity counts and source heuristics do not establish measured brain growth, intelligence, diagnosis or a validated developmental outcome. The scientific reference is analytical only; its optional OpenRouter schematic route is excluded.
4. Freeze rights-cleared synthetic fixtures, baseline/holdout and matched task budget before comparing any changed behavior. Use adult-controlled local UX only. Classify each required check as passed, failed, blocked, not run, unavailable or not applicable, with a reason and the actual command. Keep overlapping test runs separate. An unavailable evaluator, contaminated holdout or missing recipient/guardian scope blocks promotion.
5. Run the offline workflow acceptance checks below. For a deliberately supplied privacy-reduced metadata receipt, `--stdin` checks schema and status propagation only. It does not execute commands, verify artifact bytes, authenticate receipts, establish guardian authority or assess the application. Never put names, birth dates, health information, media, credentials or private conversation text into a receipt.
6. Deliver the source/test/requirement mapping and current blockers to the existing owner. Runtime checks, combined integration, browser/native acceptance, publication, merge and deployment are separate stages. A skill or diagram cannot confer authority to activate a stage.

## Offline acceptance, from repository root

`python3 .agents/skills/nurospark-evidence-review/scripts/check_review.py --self-test`

`python3 -m unittest discover -s .agents/skills/nurospark-evidence-review/scripts -p 'test_*.py' -v`

These exercise five synthetic status cases and twenty-three metadata-classifier tests, including intentional failure and blocked/unavailable outcomes. They run with Python's standard library and make no network, subprocess or application calls. The fixture SHA `aaaaaaaa...` and digest `bbbbbbbb...` are intentional synthetic markers, never execution receipts. The tests include a socket-denial guard around classification, empty/malformed fixture rejection, exact project-config matching and non-symlink regular-file checks.

For explicitly supplied bounded metadata: `python3 .agents/skills/nurospark-evidence-review/scripts/check_review.py --stdin`. It reads JSON from stdin and writes a declared-metadata result to stdout. The result always says `product_release_status: not_assessed` and carries the dated snapshot's known blockers. Unknown or missing fields and duplicate JSON keys fail closed; stdin is bounded to 64 KiB. Not-applicable checks remain blocked until separately reviewed. Passing declarations are not verified tests.

## Existing application commands, conditional

In the owner's approved complete checkout, with its existing dependencies and synthetic fixtures, `pnpm exec vitest run src/lib/sync/cloudSync.test.ts` is the focused consent command. `pnpm run verify` runs the normal typecheck/lint/test/build aggregate; `pnpm run test:e2e` and `pnpm run test:e2e:paywall` are separate UX stages. Inspect scripts and environment first. `verify:full` includes admin dependency/Chromium installation and is not an offline command. This skill does not request or perform any installation, migration, hosted test, payment or provider action.

## Seven-tool disposition

Harness evidence/status ideas, analytical scientific-critical-thinking and offline/system-font diagrams are adopted as bounded review practices. The defensive reference contributes only explicit response/request property review questions. Browser Use remains a separately gated synthetic comparison candidate; no adapter is added. Agentmemory is deferred, and OpenViking stays watch-only pending exact-artifact AGPL/legal/privacy review. Existing application architecture and owners remain authoritative.
