# NeuroSpark — accessibility notes

## Implemented (baseline)

- **Skip link** — visible on keyboard focus; targets `#app-main`.
- **Main landmark** — `role="main"` + `id="app-main"` on the primary scroll region inside the phone shell.
- **Bottom navigation** — `<nav aria-label="Primary navigation">`; each tab is a `<button type="button">` with **`aria-label`** (includes credit hint on Today when relevant) and **`aria-current="page"`** on the active tab.
- **Stack header** — back control has **`aria-label="Go back"`**; decorative chevron **`aria-hidden`**.

## Recommended next steps

- Audit **color contrast** on gradients and `glass` overlays (WCAG AA target).
- Ensure **touch targets** ≥ 44×44px where feasible (some compact chips may need padding).
- Add **`aria-expanded` / `aria-controls`** for collapsible sections (e.g. Generator cards, Profile materials).
- **Screen reader** walkthrough: Landing → Auth → Onboarding → Generate → Complete activity.

---

*Pair with `docs/MASTER_DEVELOPMENT_PLAN.md` § C.1.*
