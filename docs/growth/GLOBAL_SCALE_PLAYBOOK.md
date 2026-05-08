# Global Scale Playbook

This playbook covers Phase 6, Phase 7, and Phase 8 of the global revenue plan.

| Phase | Focus |
| --- | --- |
| **6 — Global launch** | Priority markets, listing and community motions, PR/SEO cluster; aim for completion criteria below. |
| **7 — Scale to $1M** | Double down only on channels with signal; revenue mix in “Scale To $1M”. |
| **8 — Scale to $10M** | Structural bets (capital, distribution, employer, schools, brand); paths in “Scale From $1M To $10M”. |

## Priority Markets

1. India: Razorpay fit, parent education spend, WhatsApp/community distribution.
2. US/Canada: higher ARPU, homeschool and parenting creators.
3. UK/Australia: English-speaking parent/education content markets.
4. UAE/Singapore: high willingness to pay for child enrichment.

## Global Launch Motions

- Product Hunt launch.
- App Store and Play Store launch with keyword-optimized listings.
- Weekly webinar series across time zones.
- 100 creator affiliate campaign.
- PR story: parent-led AI-age readiness without more screen time.
- SEO cluster: 50 high-intent articles and printable samples.

## Scale To $1M

Scale only channels that show signal:

- Creator affiliates if CAC is near zero.
- Webinars if show-up and purchase rates are strong.
- School/clinic partnerships if contract velocity works.
- SEO if ranking and email capture convert.
- Paid ads only after organic conversion works.

Revenue model:

- 5,000 Family Premium annual users at `$79` = `$395k`.
- 1,000 Family Pro users at `$299` = `$299k` (scenario midpoint; in-product Family Pro annual copy is `$199-$499/yr` — see `src/lib/revenue/launchPricing.ts`).
- 20 partner contracts averaging `$15k` = `$300k`.
- Workshops/templates/licensing = `$50k-$100k`.

## Scale From $1M To $10M

Likely requires at least one:

- Growth capital.
- Distribution partnerships.
- Large employer-benefit deals.
- Government/school network pilots.
- Major creator/education brand partnerships.
- Aggressive annual/prepaid campaign.

Paths (Pro ARPU in these rows uses the same **`$299` scenario midpoint** as above; live band is `$199-$499/yr`):

- Consumer-heavy: 100,000 annual users at `$79` plus 7,000 Pro users at `$299`.
- Partner-heavy: 200 partners averaging `$30k` plus 50,000 annual users.
- Hybrid: 50,000 annual users, 10,000 Pro users, 100 partners, workshops/licensing.

## PR Angles

- Children need judgment and creativity in the AI age.
- Parents want screen-light help, not more apps.
- NeuroSpark turns daily routines into developmental practice.
- Pediatrician-shareable observations without diagnosis claims.
- Printable guidance for busy parents.

## Completion Criteria

Global launch complete:

- App is live publicly.
- Signups from 10 countries.
- `$100k` cumulative revenue.

Scale to `$1M` complete:

- `$1M` cumulative revenue, or
- one channel produces predictable weekly revenue for four straight weeks.

Scale to `$10M` complete:

- Signed or collected revenue reaches `$10M`.
- Pipeline alone does not count.

## Repo alignment (what is “built” here)

- **Milestone seeds** for `$100k` / `$1M` / `$10M` in the Growth Command Center reference this playbook in `supabase/migrations/00016_growth_command_center.sql`.
- **Artifact coverage**: `src/lib/growth/growthPlanArtifacts.test.ts` includes this file.
- **Consumer pricing**: Family Premium annual **`$79/yr`** aligns with `LAUNCH_PRICING_COPY.globalPremiumAnnual` in `src/lib/revenue/launchPricing.ts`; India uses INR tiers on the paywall for the same ladder.
