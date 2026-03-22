# Deliverable Scorecard (NDEQ Rubric)

**Use for:** PRs, content drops, major copy changes, algorithm updates.  
**Scale:** 0–5 per dimension (half points allowed).  
**Weights:** For **composite**, use D1, D4, D8 at **1.5×** when computing mean.

---

## Dimensions

### D1 — Evidence & neuroscience accuracy (×1.5)

| Score | Criteria |
|-------|----------|
| 0 | False or misleading claims |
| 1 | Vague “brain booster” language |
| 2 | Some science terms; weak linkage |
| 3 | Correct general mechanisms; age appropriate |
| 4 | Clear mechanism + developmental window |
| 5 | Mechanism + cautious citation / “research suggests” + limitations stated |

### D2 — Pedagogical sequencing

| Score | Criteria |
|-------|----------|
| 0 | Harmful sequence (e.g. frustration without scaffolding) |
| 1 | Random difficulty |
| 2 | Tier-roughly matched |
| 3 | Tier + mood considered |
| 4 | Tier + history / variety rules |
| 5 | + Spaced repetition or explicit prerequisite chain |

### D3 — Parent UX & clarity

| Score | Criteria |
|-------|----------|
| 0 | Unusable or confusing |
| 1 | Heavy jargon; no next step |
| 2 | Completable with effort |
| 3 | Clear steps; skimmable |
| 4 | + Resistance tips or time estimate honesty |
| 5 | + Scripts; accessibility considered |

### D4 — Child safety & ethics (×1.5)

| Score | Criteria |
|-------|----------|
| 0 | Unsafe instruction or data practice |
| 1 | Missing age caution |
| 2 | Basic safety only |
| 3 | Materials safety; tone kind |
| 4 | + Shame-free design; AI/medical boundaries |
| 5 | + Privacy-by-design; explicit disclaimers where needed |

### D5 — Code & reliability

| Score | Criteria |
|-------|----------|
| 0 | Breaks build or leaks data |
| 1 | Works locally only; fragile |
| 2 | Works; no tests; debt |
| 3 | Typecheck clean; readable |
| 4 | + edge cases handled; documented |
| 5 | + tests / monitoring hooks |

### D6 — Personalization logic

| Score | Criteria |
|-------|----------|
| 0 | Broken or ignored inputs |
| 1 | Cosmetic only |
| 2 | One signal used |
| 3 | Multiple signals; diversity preserved |
| 4 | Observable in UI (“why picked”) |
| 5 | + validated against simulations / feedback loop |

### D7 — Content diversity

| Score | Criteria |
|-------|----------|
| 0 | Single method/region lock-in |
| 1 | Slight variety |
| 2 | Meets minimum intelligence spread |
| 3 | Good regional + method mix |
| 4 | Blueprint-aligned 7-day diversity |
| 5 | Measured over logs; corrective rules |

### D8 — Practical brain-development outcome proxy (×1.5)

| Score | Criteria |
|-------|----------|
| 0 | Pure entertainment; no developmental intent |
| 1 | Generic “learning” |
| 2 | Targets named skill area |
| 3 | Targets skill + age fit |
| 4 | + measurable parent-visible behavior change described |
| 5 | + ties to checklist / milestone framework in app |

---

## Composite (quick formula)

Let `w = 1` for D2,D3,D5,D6,D7 and `w = 1.5` for D1,D4,D8.

**Composite = Σ(score × w) / Σ(w)**

**Adopt change** if: new composite ≥ old composite **and** D8_new ≥ D8_old **and** D1_new ≥ D1_old **and** D4_new ≥ D4_old.

---

## Template (copy into PR or experiment log)

```
Deliverable: 
Rater: 
Date:

D1: __  D2: __  D3: __  D4: __
D5: __  D6: __  D7: __  D8: __

Composite: __
Notes / risks:
```
