# Legal & policy publishing checklist (NeuroSpark)

**Not legal advice.** Use this with counsel before ads, store listings, or school partnerships.

## 1. Replace in-app drafts

| Surface | Location | Action |
|---------|----------|--------|
| Terms (summary) | `LegalInfoScreen` → Terms tab | Full Terms of Service URL or expanded text |
| Privacy (summary) | Privacy tab | Privacy Policy URL + data map (local vs Supabase vs analytics) |
| Refunds / payments | Refunds tab | Final policy aligned with Razorpay + jurisdiction |
| AI disclaimer | AI tab | Boundaries for counselor + generator; record retention if any |

## 2. Keep product ↔ legal alignment

- [ ] Paywall and checkout strings match refund / subscription terms.  
- [ ] Auth screen disclosures match actual data flows (`docs/SUPABASE_AUTH.md`, `DATA_SYNC_AND_BACKUP.md`).  
- [ ] Analytics: only coarse events; policy mentions optional endpoint (`PRODUCT_ANALYTICS.md`).  
- [ ] Error monitoring: if Sentry or replay changes, update privacy disclosures (`ERROR_MONITORING.md`).  

## 3. External artifacts

- [ ] Website or help center hosts canonical PDF/HTML policies.  
- [ ] Support email or form for privacy/refund requests.  
- [ ] App store / PWA listing uses short summary + link to full policies.  

## 4. COPPA / GDPR-K cross-check

See **`docs/COPPA_GDPR_CHECKLIST.md`** after any new collection (cloud sync, push, referrals, etc.).

---

*Master plan C.4 — Terms, Privacy, AI disclaimer, refund policy.*
