# B2B SDR Hermes Skill Notes

Use these rules when adapting B2B SDR-style Hermes workflows for NeuroSpark.

## Allowed

- Research preschools, clinics, homeschool groups, parenting coaches, creators, and employer-benefit buyers.
- Score fit using `growth_icp_definitions`.
- Draft outreach into `growth_approval_queue`.
- Create `growth_opportunities` with source, rationale, next action, and compliance state.
- Recommend follow-up timing.

## Not Allowed

- No autonomous cold email or DM.
- No child outreach.
- No scraping sensitive family or child data.
- No medical, diagnostic, or guaranteed-outcome claims.
- No bypassing suppression or kill switches.

## Required Output Shape

```json
{
  "organization": "Example Preschool",
  "segment": "school",
  "sourceUrl": "https://example.com",
  "estimatedValueUsd": 2500,
  "priority": 2,
  "complianceState": "needs_review",
  "agentRationale": "Why this account fits NeuroSpark",
  "draft": {
    "subject": "Daily home-practice layer for Example Preschool",
    "body": "Approval-gated draft only"
  }
}
```

All drafts must be reviewed by a human in the Growth Command Center before sending.
