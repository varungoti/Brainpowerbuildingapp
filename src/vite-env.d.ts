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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
