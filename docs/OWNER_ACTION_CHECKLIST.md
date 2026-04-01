# Owner action checklist (things the AI / repo cannot do for you)

Use this as your personal launch backlog. Tick items when done.

**Step-by-step credential setup (Supabase, Razorpay, Sentry, flags):** see **[SETUP_CREDENTIALS.md](./SETUP_CREDENTIALS.md)**.

## Legal & trust

- [ ] Have counsel review **Terms**, **Privacy**, and **Refunds** copy in `LegalInfoScreen` and any public website policy pages.
- [ ] Document **COPPA / children’s data** posture: who is the account holder, what is collected, retention, deletion, parental rights.
- [ ] Replace placeholder support email (`support@neurospark.app`) everywhere if you use a different address.
- [ ] Align **AI disclosure** with your actual model (demo vs live) and avoid medical claims in marketing.

## Accounts & infrastructure

- [ ] Create **production Supabase** project (separate from dev/staging); configure Auth providers, RLS, and Edge Functions.
- [ ] Add **GitHub secret** `VITE_ADMIN_EMAILS` (comma-separated) so CI builds can expose Blueprint only to your team — or leave empty so Blueprint stays locked.
- [ ] Configure **Razorpay live** keys, webhooks, and reconciliation; document refund rules in-app and on the website.
- [ ] Set **Sentry** `VITE_SENTRY_DSN` and `VITE_APP_ENV` for production when ready; verify no PII in events.

## Mobile stores

- [ ] **Android:** create release keystore, enable **Play App Signing**, bump `versionCode` / `versionName` in `capacitor.config.ts` + `android/app/build.gradle` per release, build **AAB**, complete Play Console privacy & content questionnaires.
- [ ] **iOS:** Apple Developer account, certificates, **Xcode** archive, **App Privacy** labels, **Pods** on a Mac, TestFlight then App Store review.
- [ ] Test **safe areas**, keyboard, and **offline** behaviour on real devices (not only the desktop phone frame).

## Operations

- [ ] Write down **who owns** Supabase, Razorpay, Sentry, and domain DNS — see `docs/INCIDENT_RUNBOOK.md`.
- [ ] Set hosting **environment variables** per environment (`docs/ENVIRONMENTS.md`).
- [ ] Optional: use `VITE_FEATURE_FLAGS=payments_remote_kill` in an emergency to disable checkout without shipping a new binary (web deploy only).

## Optional hardening

- [ ] Move internal Blueprint to a **separate admin site** + SSO instead of in-app email allowlist.
- [ ] Enable **Android minifyEnabled** only after smoke-testing release builds with current ProGuard rules.
