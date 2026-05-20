# NeuroSpark Revenue Sprint — 10 Days, $0 → $10,000

**Honest framing.** This document is a *plan*, not a guarantee. With no existing email list, no signed APK on the Play Store, and $0 in ad budget on day 1, hitting $10,000 inside 10 days is **a 5–15% probability outcome** — not a sure thing. What this playbook does is **maximise** that probability and give you a tracked, hour-by-hour, automation-assisted execution layer on the admin panel so every productive hour counts.

The plan is structured so:

1. **Days 1–2** are zero-cost foundation work that *must* be done before any outreach.
2. **Days 3–7** are pure organic + founder-led demand creation.
3. **Days 8–10** redeploy the first revenue dollars into paid ads on whatever offer is already converting.

Stop reading and execute the **Day 1 ⇢ Hour 0 checklist** at the bottom if you are short on time. The rest explains why.

---

## 1. The math, three scenarios

Let "ASP" = average sale price (USD). Indian parent retail tier sells well at ₹999 / ₹2,499 / ₹4,999 lifetime → roughly $12 / $30 / $60 USD. Global tier sells at $39 / $99 / $199.

| Lever | Pessimistic | Base | Stretch |
|------|-------------|------|---------|
| Organic impressions over 10 days | 8,000 | 25,000 | 80,000 |
| Click-through to landing | 1.0% | 1.5% | 2.5% |
| Landing → email capture | 6% | 10% | 18% |
| Email → consumer sale | 6% | 12% | 22% |
| Avg consumer ASP (USD) | $20 | $45 | $75 |
| **Consumer revenue** | **$57** | **$2,025** | **$5,940** |
| B2B partner deals closed | 0 | 1 | 3 |
| Avg B2B deal (preschool / pediatrician / publication) | $0 | $2,500 | $4,000 |
| **B2B revenue** | **$0** | **$2,500** | **$12,000** |
| Founder-led / direct WhatsApp deals (30 conversations) | 0 sales | 6 × $99 | 12 × $199 |
| **Founder revenue** | **$0** | **$594** | **$2,388** |
| **TOTAL** | **$57** | **$5,119** | **$20,328** |

**Reading the table honestly:**

- The **consumer-only** path tops out around $2k–$6k inside 10 days. That alone will **not** reach $10k.
- The B2B path is where the money is. **One** preschool franchise / NGO / pediatrician group at $2.5–$5k makes the month.
- The founder-led path is **the highest-confidence revenue** because it converts warm 1:1 conversations.

**To hit $10k you need at minimum two of the three tracks delivering simultaneously.** Plan accordingly.

---

## 2. The four offers (priced to convert)

These are intentionally distinct so you can run all of them in parallel without cannibalising:

| # | Offer | Audience | Price | Channel |
|---|-------|----------|-------|---------|
| 1 | **Founding Parent Beta** (lifetime app + group call + activity PDF) | Indian parents 25–40 | ₹999 (~$12) | WhatsApp DM, Reddit, Telegram |
| 2 | **Founding Parent Pro** (above + 1:1 30-min coaching call + 1-yr cloud sync) | Tier-2/3 cities India + ROW | ₹2,499 (~$30) / $39 | Landing page CTA, IG bio link |
| 3 | **Founder Bundle** (everything + 1:1 monthly check-ins for a year + co-design slot) | Premium parents, founders, consultants | ₹4,999 (~$60) / $99 | LinkedIn DM, founder calls |
| 4 | **Preschool / Clinic Partner Pilot** (50 family seats, custom report, white-label PDF) | Preschools, pediatric clinics, child therapists | ₹39,999–₹1,99,999 (~$500–$2,500) | Direct outreach (LinkedIn + email + cold call) |

Rules:

- Razorpay payment links per offer (no checkout friction).
- 7-day no-questions-asked refund — required to remove buyer hesitation; you will see <5% refund rate on this audience.
- Add `notes.plan_id` and `notes.plan_name` on each Razorpay link so the **`razorpay-webhook`** edge function logs revenue per offer automatically.

---

## 3. Channels (only the high-ROI ones — no spray and pray)

### A. Reddit (highest leverage, free, fast)

Target subs:
- r/Parenting (3.6M)
- r/ScienceBasedParenting (160k)
- r/toddlers (210k)
- r/IndianParenting (24k) — *highest conversion*
- r/India + r/Mumbai/r/bangalore for India-specific
- r/preschool, r/Montessori, r/homeschool

Rules:
- **Never** drop a link without context — kills upvotes and bans.
- Format: long, story-led posts ("How I rebuilt my 4-year-old's focus in 3 weeks with 10 minutes a day"). Drop the app at the bottom as "I built this — DM if you want the parent guide free."
- 1 long post / day max per account, rotate subs.
- Reply to every comment within 30 minutes for the algorithm.

### B. WhatsApp + Telegram (highest conversion-rate channel)

- 100 personal contacts → 30 one-on-one DMs (no broadcast — those are dead).
- Script: "Hey [name], I built a parenting app for [their child's age] — would love your review. Free for the first month, no card needed."
- Asks the question, not "buy this." Convert the warm "yes" into a paid offer 1–2 days later.

### C. Indian parenting Facebook groups (very high trust)

- Search "Indian Parenting" / "[City] moms" — 50–500k member groups.
- Same long-form story rule. Add the founder context: "I'm a parent who built this myself."
- Goal: 5 groups posted in × 2 follow-up comment replies daily.

### D. LinkedIn (B2B partner pipeline + founder credibility)

- Personal post 1×/day from your own profile.
- Direct cold message 5–10 preschool owners / pediatricians / child psychologists / day-care chains daily. Use the "Preschool Pilot" offer.
- Even **one** $2,500 partner deal hits 25% of the goal alone.

### E. Twitter/X — keep it minimal

- 3 tweets/day on a tight thread theme (one weekly thread with the science). Won't move revenue alone but builds founder credibility cheaply.

### F. Paid (Days 8–10 only, only with first revenue reinvested)

- Meta ads: spend 60–70% of cumulative day-1–7 revenue, no more.
- Single high-converting reel + landing combination only. Never start cold creative on day 1 with no learnings.

---

## 4. Daily plan (hour-by-hour, Mon–Sun structure)

Times in IST. The Marketing OS admin page exposes this as a checklist that you tick off as you go (see `Marketing OS → Today` panel).

### Day 1 — Foundation, $0 expected revenue

| Hour | Action | Owner | Output |
|------|--------|-------|--------|
| 09:00–10:00 | Create the 4 Razorpay payment links with `notes.plan_id`, paste into `MARKETING_PAYMENT_LINKS` env | You | Live tracked links |
| 10:00–11:00 | Land Founding Parent Beta page section (or ConvertKit/MailerLite landing page if app store still pending) with email capture wired to `/server/growth/lead` | You | Tracked landing |
| 11:00–13:00 | Generate 30 pieces of content via the AI Growth widget on the admin page (10 IG / 5 LinkedIn / 5 Reddit / 5 WhatsApp Status / 5 Twitter) | Marketing OS / AI Growth | Drafts in Posts tab |
| 14:00–16:00 | Personalise + queue the 30 posts in the Social OS scheduler (one per day for 10 days × 3 channels). Approve in admin. | You | Calendar full |
| 16:00–18:00 | Build the first long-form Reddit post (1500+ words). Submit to r/IndianParenting. | You | Post live |
| 18:00–20:00 | DM 20 warm WhatsApp/Telegram contacts. Track each as a `crm_lead` row with source=`founder_dm`. | You | 20 leads in CRM |
| 20:00–22:00 | LinkedIn post + 5 cold DMs to preschool decision-makers from 2nd-degree connections. | You | 5 partner leads |

**Day 1 success criterion:** ≥30 leads in CRM + 1 Reddit post live + 5 partner DMs sent.  
**If you don't hit this, do not move to Day 2 paid steps.**

### Days 2–4 — Demand creation, $200–$1,000 expected revenue

Daily routine (target ~6 hours work):

- **Morning (9–11)**: Reply to every comment / DM / lead from yesterday. Update CRM status. Mark hot leads with `temperature=Hot`.
- **Mid-morning (11–13)**: 1 long-form post (Reddit OR FB group OR LinkedIn — rotate).
- **Afternoon (14–17)**: 5 founder calls or WhatsApp voice notes to top hot leads. Pitch Founding Parent Pro / Bundle.
- **Late afternoon (17–18)**: Schedule next 24h of content via Marketing OS (10 posts).
- **Evening (19–22)**: B2B partner outreach — 10 LinkedIn DMs, 3 emails to preschool chains, 1 cold call.

**Day 2 ends with**: ~5 paid sales × ₹999–₹2,499 = $30–$75; 1 partner conversation booked.  
**Day 3**: 2 partner conversations; one "interested" reply.  
**Day 4**: First $50–$500 partner pilot signed verbal yes.

### Days 5–7 — Conversion push, $1,500–$4,000 expected revenue

- Run a **48-hour Founding Parent Beta launch** — public Reddit / FB launch + price-rises-Sunday-midnight messaging.
- Send a single **email** to every captured lead with the launch offer (use `crm_leads` table → batch via `crm_tasks`).
- Close the partner pilots that have warm yes — send Razorpay link pre-loaded with `plan_id=partner_pilot_v1`.

**Day 7 cumulative target: $2,000–$5,000.** If you are below $1,000 at end of Day 7, **do not buy ads** — diagnose the bottleneck (top of funnel? landing CTR? offer? trust?) and pivot offer or messaging on Day 8.

### Days 8–10 — Reinvest, $4,000–$5,000 incremental revenue

- Take 50–70% of Day-1–7 revenue → Meta + Instagram boosted post on the single best-performing reel.
- Founder-led: 5 calls/day for 3 days closing remaining partner pilot pipeline.
- One LinkedIn long-post launch announcement on Day 9 evening.

**Day 10 ends:** target $7,500–$12,000 cumulative.

---

## 5. Automation: what's actually automated vs human-in-loop

The Marketing OS page on the admin panel exposes:

| Job | Status |
|-----|--------|
| Razorpay → revenue ledger row | **Fully automated** via `razorpay-webhook` edge function |
| Lead capture from landing → CRM | **Fully automated** via `/server/growth/lead` and `crm/leads` |
| Content generation from a brief | **Fully automated** via `ai-growth/content` |
| Schedule a post to N channels | **Half automated** — queue is real, publishing is *simulated* until OAuth keys are added (see §7) |
| Reply to comments | **Manual** (Reddit/IG don't allow third-party autoreply on free tiers; pretending otherwise gets you banned) |
| Cold WhatsApp/Telegram outreach | **Manual** + click-to-send WhatsApp link generated automatically per lead |
| Daily checklist execution | **Manual** but tracked & timestamped |
| Daily revenue → kill-switch (>$10k/day cap) | **Fully automated** via existing Growth Command Center kill switches |

Treat the "automation" claim as the **plumbing being ready**: the moment you wire one OAuth key (Meta Page or Telegram bot is the easiest), the same code goes live publishing.

---

## 6. Kill criteria — when to stop a track and rotate

| If after Day | Track | Result | Action |
|-------------|-------|--------|--------|
| 3 | Reddit | <100 upvotes total across all posts | Pivot subs (try r/Daddit, r/Mommit, r/breastfeeding) |
| 4 | LinkedIn B2B | 0 partner replies | Switch from DMs to direct email + 1 cold call |
| 5 | Founder Beta | <20 leads | Drop ASP to ₹499 / $9 for 48h flash |
| 7 | Cumulative revenue | <$500 | Skip ad spend on Days 8–10. Stay organic + founder calls. |
| 7 | Cumulative revenue | <$200 | Pause sprint. Diagnose product/positioning before more outreach. |

---

## 7. Required environment variables (set these in Supabase Edge → Secrets)

```bash
# Marketing OS edge functions
SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role>
TOKEN_ENCRYPTION_KEY=<openssl rand -base64 32>
CRON_SECRET=<openssl rand -base64 32>

# Razorpay (live revenue)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Per-offer payment links — paste full Razorpay URLs (with notes.plan_id baked in)
NUROSPARK_BETA_PAYMENT_LINK=https://rzp.io/i/...
NUROSPARK_PRO_PAYMENT_LINK=
NUROSPARK_BUNDLE_PAYMENT_LINK=
NUROSPARK_PARTNER_PAYMENT_LINK=

# AI content generation (Fireworks already wired in app server function)
FIREWORKS_API_KEY=

# Optional — once you wire one social provider, scheduler goes live:
# Telegram is the easiest first integration (5 min, no audit)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
```

Admin web (`admin/.env`):

```bash
VITE_EDGE_BASE_URL=https://YOUR_REF.supabase.co/functions/v1
VITE_MARKETING_OS_BASE=https://YOUR_REF.supabase.co/functions/v1
```

---

## 8. Day 1 ⇢ Hour 0 quick-start checklist

Open the **Marketing OS** page in the admin panel and tick these off in order:

1. ☐ Set the 4 env vars `NUROSPARK_*_PAYMENT_LINK` to live Razorpay payment links (with `notes.plan_id` set).
2. ☐ Run `pnpm run supabase:db:push` to apply migration `00018_marketing_os.sql`.
3. ☐ Deploy the 5 new edge functions: `supabase functions deploy crm marketing-os ai-growth social-os social-publish-worker razorpay-webhook`.
4. ☐ Configure Razorpay webhook → `https://YOUR_REF.supabase.co/functions/v1/razorpay-webhook`. Save signing secret in `RAZORPAY_WEBHOOK_SECRET`.
5. ☐ In Marketing OS → Content → click **Generate 30 posts** to seed the queue.
6. ☐ Add your 100 warm contacts as leads (paste CSV in CRM → Bulk add).
7. ☐ Open the **Today** panel and execute the hour-by-hour list. Tick each item.
8. ☐ At end of day, click **Score Day** in admin → updates Growth Command Center daily OKR automatically.

---

## 9. Decision log & accountability

End of every day, write **2 lines** in Marketing OS → Daily Brief:

- What worked best (channel + post + offer combination)
- What wasted the most time

This feeds the existing Growth Command Center `daily_briefs` table and shows up next morning in *Recommended Objective*. Without this loop you will repeat the same low-ROI motion for 10 days.

---

**Final word.** The product is good. The script you need is *consistency*: 30 leads/day × 10 days × 3% close rate × $50 ASP = $450/day = $4,500. Add one $2.5k partner deal = $7k. Add 60% reinvested ad spend = ~$10k. **The math is doable; the only failure mode is not executing daily.** Use the admin panel to remove every excuse and timestamp every action.
