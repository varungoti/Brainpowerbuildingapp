# NeuroSpark Hermes Growth Agent

Hermes is the research and strategy layer for the Growth Command Center. It should run in dry-run mode first and write briefs, opportunities, and draft approvals into Supabase.

## Required Defaults

- Research-only by default.
- Draft-only for campaigns and outreach.
- Approval-gated sending.
- No autonomous cold outreach.
- No child/family sensitive data collection.

## Environment

```bash
NS_ADMIN_API_BASE=https://your-edge-function.example.com
NS_ADMIN_BEARER_TOKEN=manual-service-token-or-secure-job-token
NS_GROWTH_DRY_RUN=true
NS_GROWTH_REQUIRE_APPROVAL=true
NS_HERMES_SCHEDULE="0 7 * * *"
```

## Outputs

Hermes may create:

- `growth_agent_briefs`
- `growth_opportunities`
- `growth_approval_queue` drafts
- `growth_experiments`
- `growth_automation_runs` dry-run rows

Hermes must not:

- Send email or DMs.
- Publish social posts.
- Change kill switches.
- Override suppression.
- Claim medical outcomes.

## Schedules

Use `schedules.json` for the initial dry-run schedule definitions:

- Daily market intelligence.
- Daily opportunity radar.
- Weekly growth review.
- Weekly campaign backlog.

All jobs are dry-run by default and must write to Growth Command Center tables or approval queue only.

## B2B SDR Skill Adaptation

See `b2b-sdr-skill-notes.md`. Any SDR-style workflow must create drafts and opportunities only; live outreach requires human approval, suppression checks, and kill-switch clearance.

## Production Promotion

Before scheduled runs are enabled:

1. Run one manual dry run.
2. Review the generated brief in `/admin/growth`.
3. Confirm no prohibited claims.
4. Confirm every outreach draft lands in the approval queue.
5. Confirm kill switches block execution.
6. Confirm audit logs record all writes.
