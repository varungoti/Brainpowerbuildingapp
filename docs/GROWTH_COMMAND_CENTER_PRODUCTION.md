# Growth Command Center Production Runbook

This runbook keeps the $10M growth system aggressive without allowing fragile or unsafe automation into production.

## Production Gate

Live outbound automation is blocked unless all are true:

- `pnpm run growth:check` passes.
- Readiness average is 90+.
- No subsystem score is below 85.
- Suppression, audit logging, and kill switches score 100.
- No P0/P1 funnel or automation bugs are open.
- `global_marketing_pause`, `force_manual_approval`, and channel-specific pauses are intentionally configured.
- A dry run writes a successful `growth_automation_runs` row.
- A human approves the campaign/action in `growth_approval_queue`.

## Daily Workflow

Morning:

1. Open Admin → `$10M Growth`.
2. Create today’s OKR with base/stretch/overachievement revenue targets.
3. Review pending approvals and kill switches.
4. Confirm production readiness before any traffic or outreach push.

Midday:

1. Record revenue and pipeline checkpoints.
2. If base progress is below 40%, switch to recovery mode.
3. If base is already hit, raise the day to stretch/overachievement.

Evening:

1. Record the daily learning brief.
2. Score the OKR.
3. Add tomorrow’s highest-leverage experiment.
4. Keep or kill campaigns based on revenue/pipeline signal, not attention alone.

## Safe Automation Policy

Mautic, n8n, Postiz, and Hermes must run in dry-run or approval-gated mode until the production gate is green.

Never automate:

- Outreach to children.
- Medical or diagnostic claims.
- Guaranteed developmental outcomes.
- Cold outreach without source, reason-for-contact, opt-out, and suppression checks.
- Live publishing while `social_publishing_pause` is enabled.

## Deployment Steps

1. Apply `supabase/migrations/00016_growth_command_center.sql`.
2. Deploy Supabase Edge Functions with the updated admin routes.
3. Deploy the admin app.
4. Set `PUBLIC_GROWTH_LEAD_ENDPOINT` on the marketing site to the deployed `/growth/lead` endpoint.
5. Add at least one marketing admin in `admin_users`.
6. Configure Mautic, n8n, Postiz, and Hermes credentials outside the client app.
7. Run one lead-capture smoke test from `/ai-age-starter-pack`.
8. Run one dry-run workflow and confirm it appears in Admin → `$10M Growth`.
9. Test every kill switch.
10. Test suppression before any send.
11. Confirm audit log entries for all writes.
12. Confirm `GET /admin/growth/mautic/status` reports the expected safe state.
13. Confirm Hermes scheduled jobs write only briefs/opportunities/approval drafts.
14. Only then approve a small live campaign.

## Current Known Manual Dependencies

- External Mautic hosting and mailer credentials.
- SPF/DKIM/DMARC and sending-domain warmup.
- Legal/compliance review of claims, terms, privacy, affiliates, and outreach.
- Payment provider production credentials and live checkout smoke test.
- Production Supabase migration deployment.
