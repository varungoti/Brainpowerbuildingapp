/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional HTTPS URL to POST JSON analytics events (no PII); implement RLS/auth on your side */
  readonly VITE_ANALYTICS_ENDPOINT?: string;
  /** Optional Sentry DSN; only initialized in production builds (see docs/ERROR_MONITORING.md) */
  readonly VITE_SENTRY_DSN?: string;
  /** Logical deploy name for Sentry (e.g. production | staging); defaults to Vite MODE */
  readonly VITE_APP_ENV?: string;
  /** Comma-separated admin emails allowed to open internal Blueprint docs (production). */
  readonly VITE_ADMIN_EMAILS?: string;
  /** Comma-separated superadmin emails: may edit/delete any community feed post. If unset, uses VITE_ADMIN_EMAILS. */
  readonly VITE_SUPERADMIN_EMAILS?: string;
  /** Comma-separated community admin emails: may edit/delete any feed post in the default community. */
  readonly VITE_COMMUNITY_ADMIN_EMAILS?: string;
  /** Dev only: if "true", any signed-in user can moderate feeds (never ship to production). */
  readonly VITE_FEED_MODERATION_DEV_OPEN?: string;
  /** If "true" and Vite is in dev mode, any signed-in user can open Blueprint (never enable in prod builds). */
  readonly VITE_BLUEPRINT_DEV_OPEN?: string;
  /** Injected at build time from package.json version — do not set manually in .env files. */
  readonly VITE_APP_VERSION: string;
  /** Optional comma/space-separated flags; see src/utils/featureFlags.ts */
  readonly VITE_FEATURE_FLAGS?: string;
  /** E2E paywall build: skip creating Supabase browser client (avoids calls to fake host). */
  readonly VITE_E2E_SUPPRESS_SB_CLIENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
