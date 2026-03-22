# Content & Media Orchestration

NeuroSpark does **not** self-modify its code or auto-publish generated assets. Instead, this repo now contains a bounded orchestration foundation for prompt-driven image/audio/video asset creation that remains optional, provider-neutral, and review-gated.

## What is in repo

- `src/content/media/orchestration.ts`
  - Builds structured prompt packets from reviewed `Activity` metadata.
  - Carries evidence anchors, safety constraints, format notes, and parent-facing goals into every generated brief.
- `src/content/media/featuredBlueprints.ts`
  - Starter prompt packets for the AI-literacy activity cluster.
- `config/media-orchestration.example.json`
  - Placeholder provider config. Disabled by default and safe to commit.
- `scripts/content-validate.ts`
  - Fails when reviewed activities are missing metadata or prompt packets lose required sections.

## Guardrails

- No external provider is called from the app by default.
- Every generated-media workflow assumes **manual review before publish**.
- Activity metadata must include:
  - `reviewStatus`
  - `mechanismTags`
  - `goalPillars`
  - `durationVariants`
  - `contraindications`
  - `progression`
- Prompt packets always include:
  - research anchors
  - safety constraints
  - age-stage notes
  - material constraints

## Validation commands

```bash
pnpm run content:validate
pnpm run age:report
```

Use `content:validate` before adding new prompt templates or reviewed activities. Use `age:report` to spot-check the curriculum engine's diversity and pillar coverage after tuning AGE.

## Recommended workflow

1. Mark or update an activity as `reviewed`.
2. Verify its metadata in `src/app/data/activities.ts`.
3. Generate prompt packets with the orchestration helpers.
4. Review the prompt output for safety, realism, and developmental fit.
5. Only then send the packet to an external model or creative pipeline.

## Why this is safer

This design gives NeuroSpark compounding prompt/media quality improvements through better metadata and repeatable validation, without unsafe "self-modifying AI" behavior and without any hidden publishing path.
