# Product analytics (privacy-light)

## What ships in the app

Events are emitted via **`captureProductEvent`** (`src/utils/productAnalytics.ts`). Payloads are **coarse** and avoid PII:

| Event | When | Fields (examples) |
|-------|------|-------------------|
| `paywall_view` | Paywall screen mount | `age_tier` |
| `paywall_plan_select` | User taps a plan | `plan_id`, `days`, `amount_inr`, `age_tier` |
| `paywall_checkout_start` | Razorpay flow starts | same + checkout intent |
| `paywall_checkout_dismiss` | User closes Razorpay modal | `plan_id`, `age_tier` |
| `paywall_purchase_success` | Verification succeeded | `plan_id`, `days`, `amount_inr`, `age_tier` |
| `paywall_purchase_fail` | Non-cancel error | `fail_reason` (truncated), `plan_id`, `age_tier` |
| `pack_generate` | AGE returns a pack | `mood`, `time_min`, `pack_size`, `age_tier`, optional AGE toggles |
| `activity_complete` | Parent marks activity done | `primary_intel`, `duration_min`, `region` (cultural) |

**Not sent:** child name, email, Supabase uid, activity ids, free-text parent notes.

## Configuration

1. **Development** — events are mirrored to **`console.debug`** (`[NeuroSpark analytics]`).
2. **Optional sink** — set **`VITE_ANALYTICS_ENDPOINT`** to an HTTPS URL that accepts `POST` JSON (see `.env.example`). Use **`keepalive`**-friendly short requests.
3. **Supabase Edge (this repo)** — if you deploy `supabase/functions/server`, you can point the app at:
   `https://<PROJECT_REF>.supabase.co/functions/v1/make-server-76b0ba9a/analytics/event`  
   The client sends **`Authorization: Bearer <VITE_SUPABASE_ANON_KEY>`** when that env var is set (same as other Edge calls). The handler only accepts known event names and increments **daily counts** in `kv_store` (`analytics:counts:YYYY-MM-DD`). **Treat the anon key as public**; rely on allowlists, rate limits, and no sensitive payloads — not on secrecy of the URL.

## Your backend responsibilities

- Reject or strip any unexpected fields.
- Rate-limit and **do not** store IP with child-related labels without disclosure.
- Align with **COPPA / GDPR-K** if minors’ households are identifiable at ingress.

## Funnel (example)

`paywall_view` → `paywall_plan_select` → `paywall_checkout_start` → (`paywall_purchase_success` | `paywall_checkout_dismiss` | `paywall_purchase_fail`)

---

*See `MASTER_DEVELOPMENT_PLAN.md` § C.4.*
