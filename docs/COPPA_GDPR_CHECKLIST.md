# COPPA / GDPR-K checklist (NeuroSpark)

**Status:** engineering + product checklist — **not legal advice.** Have counsel review before marketing, especially to families with children under 13 (US) or in the EU/UK.

## 1. Data we intentionally avoid (app design)

- No child accounts without verifiable parental consent flows (if you add them).
- Product analytics payloads avoid PII (see `docs/PRODUCT_ANALYTICS.md`).
- Child name and free-text notes stay **local-first** unless you add explicit cloud sync with disclosure.

## 2. Before collecting anything new

| Item | Action |
|------|--------|
| **Purpose limitation** | Document why each field exists; delete when no longer needed. |
| **Lawful basis (GDPR)** | Consent vs legitimate interest — document per processing activity. |
| **COPPA** | If service is directed to children or you have actual knowledge of under-13 users, follow COPPA collection/consent/parental rights rules. |
| **Age gates** | Clarify whether the **parent** is the account holder only; avoid treating the child as the “user” for signup without review. |
| **Third parties** | Razorpay, Supabase, AI providers — list sub-processors and purposes in Privacy Policy. |
| **International transfers** | If EU/UK users, address SCCs / UK IDTA as applicable. |

## 3. In-app / site copy (replace drafts before launch marketing)

- [ ] Privacy Policy (final)  
- [ ] Terms of Use (final)  
- [ ] Refund / subscription terms (aligned with Razorpay + your policy)  
- [ ] AI disclaimer (no medical/diagnostic claims; see `legal_info` draft)  
- [ ] Contact for privacy requests and data deletion  

## 4. Technical hygiene

- [ ] Supabase RLS on any table holding PII or child-linked records.  
- [ ] Rate limits on public or anon-authenticated endpoints (including analytics ingest).  
- [ ] No analytics event names or properties that embed identifiers.  
- [ ] Error monitoring (e.g. Sentry) configured to **scrub** PII; **Session Replay off** by default in this repo (`docs/ERROR_MONITORING.md`) — if you enable replay or `setUser`, reassess disclosure and retention.  

## 5. Parent rights (design for)

- Export of linked data (if cloud sync exists).  
- Deletion request workflow and retention notes.  
- Clear explanation of **local-only** vs **cloud** modes (see Auth / Profile copy).  

---

*Cross-ref: `MASTER_DEVELOPMENT_PLAN.md` § C.4, `docs/PRODUCT_ANALYTICS.md`, in-app `LegalInfoScreen`.*
