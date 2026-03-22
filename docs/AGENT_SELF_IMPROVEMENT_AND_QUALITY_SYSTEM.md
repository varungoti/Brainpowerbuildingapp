# NeuroSpark — Agent Self-Improvement & Quality System (NDEQ)

**NDEQ** = **NeuroSpark Delivery & Excellence Quality** system.  
It governs how **humans and AI coding assistants** improve skills **deliberately**: scored expertise areas, **small experiment bursts**, and **strict adoption rules** so only changes that **raise quality *and* support practical child-development outcomes** persist.

> **Scope:** This is an **operational framework** for building the product. It does **not** imply autonomous self-modifying AI in production. “Agents” = roles (e.g. *Content Agent*, *Engineering Agent*) that can be a person, a Cursor chat, or a scheduled human review.

---

## 1. Principles

1. **Score everything that matters** — Use shared rubrics; avoid subjective “feels better.” **Project lead may assign and revise domain scores** in `EXPERIMENT_LOG.md` after each adopted change (composite is the trend line).  
2. **Small bursts** — Experiments run 1–3 days, one variable at a time when possible.  
3. **Adopt only on evidence** — Merge if composite **↑** and **child-outcome proxy** does not regress.  
4. **Rollback is success** — Reverting a failed experiment is a positive outcome.  
5. **Child safety over velocity** — No tradeoff that weakens safety or truth-in-science.

---

## 2. Domains of expertise (maintain scores)

Each domain uses a **0–5** maturity score, reviewed **weekly** (project) or **daily** (intensive sprints). Record scores in `docs/EXPERIMENT_LOG.md` (summary table) or team tracker.

| ID | Domain | What “5” looks like |
|----|--------|---------------------|
| **D1** | **Evidence & neuroscience accuracy** | Every activity has mechanism + age window; claims hedged; citations where needed |
| **D2** | **Pedagogical sequencing** | Tiers progress; prerequisites respected; spaced repetition honored |
| **D3** | **Parent UX & clarity** | 60s onboarding to value; instructions scannable; resistance scripts |
| **D4** | **Child safety & ethics** | No shaming; age gates; AI disclaimers; COPPA-aware design choices |
| **D5** | **Code & reliability** | Typecheck green; critical paths tested; no circular hacks |
| **D6** | **Personalization logic** | KYC/history measurably change packs; diversity constraints hold |
| **D7** | **Content diversity** | Methods/regions/intelligences balanced over time |
| **D8** | **Practical brain-development results (proxy)** | Rubric § “Outcome proxy” + parent checklist alignment |

**Composite score** = average of D1–D8 (or weighted: D1, D4, D8 at 1.5× if you need stricter safety/science).

---

## 3. Daily self-improvement loop (for contributors / “agents”)

### Morning (5–15 min)

1. Read **open experiments** in `EXPERIMENT_LOG.md`.  
2. Pick **one** skill gap (lowest domain score or active sprint goal).  
3. Define **micro-goal** (e.g. “Add 2 mechanism tags to activities,” “Add KYC line to AGE trace”).

### During work

4. Apply [DELIVERABLE_SCORECARD](./rubrics/DELIVERABLE_SCORECARD.md) before opening PR.  
5. If touching algorithm or content: note **hypothesis** (e.g. “Higher creativity KYC boosts Creative without dropping diversity below 4 intels/pack”).

### End of day

6. Log **score delta** (before/after rubric on the deliverable).  
7. If experiment complete: **DECISION** = Adopt / Extend / Revert (see §5).

---

## 4. Experiment bursts (protocol)

### 4.1 Charter (required before burst)

| Field | Description |
|-------|-------------|
| **Hypothesis** | If we change X, then Y improves because Z |
| **Scope** | Files/features; max lines or stories |
| **Duration** | 1–3 days |
| **Success metrics** | Rubric composite ≥ prior + **D8 ≥ prior**; optional quantitative (e.g. avg intelligences/pack) |
| **Abort criteria** | Safety issue; test failure; rubric drop > 0.5 on D1 or D4 |

### 4.2 During burst

- Ship in **small commits**.  
- Run **`pnpm run verify`** (typecheck + **lint** + tests + build) before merge; at minimum `pnpm typecheck` and `pnpm run build`.  
- For content: **peer review** by second human or separate AI session with rubric.

### 4.3 After burst

- Fill **Experiment result** section in `EXPERIMENT_LOG.md`.  
- Update **domain scores** if sustained improvement is validated.

---

## 5. Adoption gate (mandatory)

A change is **ADOPTED** only if **all** apply:

1. **Composite rubric** ≥ previous baseline on the same artifact type (or +0.3 if baseline was 4+).  
2. **D8 (practical outcome proxy)** does not decrease.  
3. **D1 / D4** do not decrease (non-negotiable).  
4. **Automated checks** pass (typecheck, build, any E2E).  
5. **Diversity / safety spot-check** for generator changes (e.g. 20 simulated runs: min intelligence count, max region skew).

If **1–4** pass but diversity fails → **REFINE**, not adopt as-is.

---

## 6. Simulated “agents” (role-based)

| Agent role | Primary domains | Typical experiments |
|------------|-----------------|---------------------|
| **Science Editor** | D1, D2, D8 | New parent tips; mechanism tags |
| **UX Parent** | D3, D4 | Onboarding steps; tone |
| **Engineering** | D5, D6 | `runAGE`, sync, performance |
| **Curriculum** | D2, D7 | New activities; regional balance |
| **Safety/Legal** | D4, D1 | Copy review; data collection |

Same human can wear multiple hats; the **scores are per domain**, not per person.

---

## 7. Relation to product metrics

| NDEQ domain | Maps to product metric |
|-------------|-------------------------|
| D6, D7 | Distinct intelligences / week; region spread |
| D3 | Task success: “generated pack” → “completed 1 activity” |
| D8 | Parent checklist trend (when shipped) |
| D4 | Incident count; support tickets |

---

## 8. Tooling (optional future)

- Script: Monte Carlo `runAGE` distribution report (tier × KYC profiles).  
- CI job: rubric checklist as PR comment template.  
- CMS: required fields before publish (mechanism, age, materials).

---

*This document should be updated when rubric weights change or new domains are added.*
