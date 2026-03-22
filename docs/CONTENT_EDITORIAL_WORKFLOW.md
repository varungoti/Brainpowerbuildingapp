# Content editorial workflow (activities)

**Goal:** Keep `src/app/data/activities.ts` (and related copy) **safe, accurate, and reviewable** — especially for children.

## Roles

| Role | Responsibility |
|------|----------------|
| **Author** | Drafts activity text, tags, durations, materials |
| **Reviewer** | Checks claims, age fit, safety, cultural sensitivity |
| **Eng** | Types + IDs, runs `pnpm run verify`, links generator/counselor if needed |

## Draft → review → publish (repo-based)

1. **Branch** off `main` with a short name (`content/add-motor-activities-3`).
2. **Edit** activity definitions in the codebase (single source of truth today).
3. **Self-check** (author): mechanism tag present; no medical/diagnostic language; duration realistic; contraindications noted if any.
4. **Reviewer pass** (PR): use `docs/rubrics/DELIVERABLE_SCORECARD.md` dimensions **D1 Evidence**, **D4 Safety**, **D7 Diversity**.
5. **Verify:** `pnpm run verify` must pass before merge.
6. **Merge** to `main`; deploy follows your hosting pipeline.

## What “publish” means today

There is no separate CMS: **shipping the merge** updates the app catalog for the next build.

## Future (optional)

- Portable JSON or MD front-matter export for non-engineer authors.  
- Staging environment + content flags (`draft` / `published`) if the catalog moves to Supabase.

---

*Master plan C.3 — editorial workflow.*
