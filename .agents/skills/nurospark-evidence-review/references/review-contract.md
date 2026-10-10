# NuroSpark source and acceptance contract

Reviewed 10 October 2026. This is a dated workflow integration, not a new runtime audit or an application release claim.

## Requirement-to-source binding

- NS-D06 and NS-R07–NS-R13: guardian authority, minimization, family/subject isolation, revocation and deletion. Source review starts at `src/lib/sync/cloudSync.ts`, its test, `src/app/context/AppContext.tsx` and `src/components/sync/CloudSyncCard.tsx`. Existing [consent draft PR1](https://github.com/varungoti/Brainpowerbuildingapp/pull/1), head `8fde2bd7f151f10eb09c5e3c234ac286853e496f`, repairs deferred-dispatch and suspended-caller races. It is not in inspected main. Recheck PR state/head before reuse; a transport-generation token is not server authorization.
- NS-D07, WP06 and IMP: source-supported nonclinical claims, frozen evaluation and reproducibility. `src/lib/reports/weeklyReportData.ts`, `src/lib/reports/weeklyReportData.test.ts`, `src/lib/competencies/aiAgeCompetencies.test.ts` and `src/lib/milestones/bayesianPredictor.test.ts` are existing source/test anchors. Their existence is not proof the formulas are clinically validated or their current tests pass.
- WP10: adult-led synthetic first-activity, core and paywall flows exist under `tests/e2e/`. Keep UI observations distinct from backend receipts. No child media, camera/voice capture, teacher sharing, diagnostic screening or training/marketing reuse is enabled.
- Related payment truth: [payment draft PR2](https://github.com/varungoti/Brainpowerbuildingapp/pull/2), head `e172e997602df99b5884c23a6375ee0175f645db`, preserves the reviewed acknowledgement boundary. Its atomic ingest RPC/migration is absent, so authentic settlements remain HTTP503. Mocked receipt checks do not establish database concurrency or real settlement acceptance. This skill changes none of its files.

## Required review checks

The offline classifier's check IDs deliberately match this project's gaps:

1. `consent_generation`: opt-out, serialization-time revocation, suspended lookup, off/on generation, and already-dispatched limits; keep caller and transport source together
2. `guardian_scope`: purpose-bound synthetic subject/family scope, revoked permissions and honest deletion/retention limits; no real records or externally shared reports
3. `claim_appraisal`: distinguish observational activity coverage, prediction and causal/clinical claims; retain source contradictions and missing reporting
4. `adult_ux`: local synthetic navigation, interruption/cancel/retry/offline/unavailable states; source assertions alone do not prove rendered behavior

The helper only validates declared metadata/status consistency. Artifact digests are declarations, not verification that a file exists or matches. Its accepted-field schema is not a secret detector. Keep receipts privacy-reduced and review content before retention/publication.

## Claim appraisal

For a public research citation or synthetic statistical method, write: exact question/population/outcome/time point; independent sampling unit; source location and numerical denominator/uncertainty; missing reporting; confounding/selection/attrition/dependence; exploratory versus confirmatory status; applicability limits; and what evidence would change the conclusion. Do not turn checklist counts into a scientific quality score. Formal clinical/developmental review remains a separate gate.

The selected scientific reference has no required network for analytical guidance. Do not import its environment, invoke optional schematics, use a provider key, or send private child/health context to research services.

## Offline architecture view

[`review-boundary.svg`](review-boundary.svg) is an original, system-font-only diagram of the inspected consent/report review boundary. Solid source panels denote inspected main; the separate dashed panel denotes the unmerged consent candidate. It contains no private URLs, record values or external assets. This source/document view does not claim runtime proof. Recheck labels when the candidate changes.

## Reviewed reference attribution

No upstream executable code, scripts, assets or full skill text was copied. The local workflow and checker are original adaptations.

- [Awesome Harness Engineering](https://github.com/ai-boost/awesome-harness-engineering/tree/378a07b1f717f88e4128e9a26eefafe714272cc4): observed checkpoint, reference-list CC0-1.0; linked resources retain separate terms. Adapted original task ownership, explicit failure and immutable-evidence practices
- [Scientific critical thinking](https://github.com/K-Dense-AI/scientific-agent-skills/blob/526ebce143bc326f44471554e33d66a19c840360/skills/scientific-critical-thinking/SKILL.md): v2.72.0 commit, MIT; analytical guidance selected, optional paid/network figures excluded. Kassis, T., Agarwal, V., He, Y., Patel, D., and Brueckner, A. M. (2026), [Scientific Agent Skills: A Library of Procedural Knowledge for Research Agents](https://doi.org/10.48550/arXiv.2609.00065), current arXiv v2 verified 10 October 2026. The paper reports documentation-corpus properties and no task-level evaluation; it does not validate this app
- [BOPLA defensive reference](https://github.com/mukul975/Anthropic-Cybersecurity-Skills/blob/54a798831d2266a3ca61ce68a7acb80b81160d57/skills/detecting-broken-object-property-level-authorization/SKILL.md): Apache-2.0 observed checkpoint, independent community project, not Anthropic-affiliated. Only passive allowlisted response/request property questions are selected; active scanners, mutable API calls, accounts and dependencies are excluded
- [Diagram Design](https://github.com/cathrynlavery/diagram-design/tree/8d8b2993ee2256ee7dfc0eeb3b5713aba3b60792): older observed MIT checkpoint, not represented as latest; only offline/source-bound diagram principles selected, no hook/renderer/font download
- [Browser Use 0.13.11](https://github.com/browser-use/browser-use/releases/tag/0.13.11): MIT candidate only; a future separately approved comparison must review telemetry, domain/redirect/private-network constraints, isolated profiles, downloads and CAPTCHA policy with matched synthetic budgets
- [Agentmemory v0.9.30](https://github.com/rohitg00/agentmemory/releases/tag/v0.9.30): deferred; no automatic developer history/session capture, key detection or current-store replacement
- [OpenViking v0.5.0](https://github.com/volcengine/OpenViking/releases/tag/v0.5.0): watch-only; core AGPL-3.0 and artifact exceptions require exact legal/privacy review before any import or service proposal
