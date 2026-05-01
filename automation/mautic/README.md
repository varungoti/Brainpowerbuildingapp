# NeuroSpark Mautic Growth Automation

Mautic is the email/lead-nurture layer for the Growth Command Center. It must be deployed with conservative defaults:

- `NS_GROWTH_DRY_RUN=true`
- `NS_GROWTH_REQUIRE_APPROVAL=true`
- `NS_GROWTH_SUPPRESSION_REQUIRED=true`
- `MAUTIC_EMAIL_SEND_ENABLED=false`

Initial segments and campaign templates live in `segments-and-campaigns.json`. They are definitions only; do not import or activate them until the Growth Command Center approval queue, suppression checks, domain authentication, and unsubscribe links are verified.

Do not send live email until:

1. SPF, DKIM, DMARC, bounce handling, and unsubscribe links are verified.
2. The sender identity and physical/business address are correct.
3. The Growth Command Center suppression list is checked before every send.
4. Every campaign is approved in `/admin/growth`.
5. `global_marketing_pause`, `cold_outreach_pause`, and `force_manual_approval` states are respected.
6. A dry run has written `growth_automation_runs` with `status=succeeded`.

## Production Flow

1. Capture leads with Mautic forms or landing pages.
2. Sync lead events to Supabase through `/admin/growth/webhooks/mautic` once implemented.
3. Create campaign drafts in `growth_approval_queue`.
4. Human approves campaign, audience, channel, and rate limit.
5. n8n triggers Mautic only after approval and suppression checks.
6. Every send writes an audit record and an automation run.

## Admin Endpoints

The Edge admin API exposes:

- `GET /admin/growth/mautic/status`
- `GET /admin/growth/mautic/summary`

These endpoints intentionally report `safeToSend: false` until the production gates are satisfied.

## Never Automate

- Outreach to children.
- Medical, diagnostic, or guaranteed-outcome claims.
- Scraped sensitive child/family data.
- Emails without unsubscribe or sender identity.
- High-volume cold outreach from a new domain.
