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
  /** If "true" and Vite is in dev mode, any signed-in user can open Blueprint (never enable in prod builds). */
  readonly VITE_BLUEPRINT_DEV_OPEN?: string;
  /** Injected at build time from package.json version — do not set manually in .env files. */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
