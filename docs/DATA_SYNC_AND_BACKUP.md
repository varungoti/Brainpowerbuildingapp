# Data sync, backup, and future cloud import

## Today (local-first)

- All NeuroSpark state lives in **browser `localStorage`** under key **`neurospark_v2`**.
- **Profile → Backup & new device**
  - **Download backup (.json)** — wrapped format `neurospark_backup` v1 (see `src/utils/neurosparkBackup.ts`).
  - **Restore** — pick a backup file; after confirmation, **replaces** all local data (same as a fresh import on a new browser).

**Privacy:** backup files can include **child names**, **parent notes** on activities, and **email** if you use account sign-in. Store and share backups like any sensitive family file.

## Not implemented yet

- **Merge** two devices (conflict resolution) — use backup **replace** on the device you want to match the file.
- **Automatic cloud sync** — see `docs/SUPABASE_SCHEMA_PLAN.md` and `supabase/migrations/`.

## Future cloud import wizard (planned)

1. Parent signs in (Supabase Auth).  
2. App offers **“Import from file”** (this flow) or **“Restore from cloud”** (pull latest snapshot).  
3. Conflict UI: **keep local** / **use server** / **per-section merge** (TBD).  

The current JSON backup is the **portable artifact** that future cloud flows should accept server-side.

## Related files

| Area | Location |
|------|-----------|
| Backup parse/build | `src/utils/neurosparkBackup.ts` |
| Context hooks | `exportLocalDataBackup`, `importLocalDataBackup` in `AppContext.tsx` |
| SQL sketches | `supabase/migrations/00001_app_future_sync.sql`, `00002_rls_sketch_profiles_children.sql` |

---

*Master plan C.1 — localStorage → cloud import wizard (v1: local file backup + restore).*
