# NeuroSpark — Supabase schema & RLS plan (draft)

**Status:** Planning only — app data remains in `localStorage` until sync is implemented.  
**Companion migrations (sketches, not auto-applied to prod):**  
`supabase/migrations/00001_app_future_sync.sql` · `00002_rls_sketch_profiles_children.sql`

---

## 1. Goals

- Same account, multiple devices (optional).
- Parent is account holder; child records are owned by parent.
- Row Level Security (RLS) so users only read/write their own rows.
- Minimal PII in Postgres; avoid storing raw child photos unless product requires it.

---

## 2. Suggested tables (v1)

| Table | Purpose |
|-------|---------|
| `profiles` | `id` = `auth.users.id`, display name, `updated_at` |
| `children` | `id`, `user_id`, encrypted-at-rest JSON or normalized columns for `ChildProfile` |
| `activity_logs` | Append-only completions linked to `child_id` + `user_id` |
| `kyc_snapshots` | Optional JSON per child + `user_id` |
| `outcome_checklists` | Monthly rows per child |
| `generator_prefs` | Optional flags (`boost_ai_literacy`, `boost_dual_task`) per user |

Use `user_id uuid references auth.users(id) on delete cascade not null` on all child-owned data.

---

## 3. RLS policies (pattern)

- `select`, `insert`, `update`, `delete` on child-owned rows: `auth.uid() = user_id`.
- Service role only for admin jobs (never from the browser).

---

## 4. Client flow (future)

1. After Supabase sign-in, pull latest snapshot or merge with local `neurospark_v2`.
2. Conflict policy: last-write-wins per section or explicit “import / keep local” wizard (`MASTER_DEVELOPMENT_PLAN` C.1).
3. Background: debounced upsert on `save()` from `AppContext`.

---

## 5. Checklist before production

- [ ] Enable RLS on every user table.
- [ ] No policy allows `anon` to read other users’ rows.
- [ ] COPPA/GDPR-K posture documented (parent account, minimal child PII).
- [ ] Audit log or soft-delete if compliance requires it.

---

*Update this doc when the first real migration ships.*
