/**
 * Internal blueprint / architecture docs: only for allowlisted admin emails.
 * Set VITE_ADMIN_EMAILS in production (comma-separated, case-insensitive).
 * Optional: VITE_BLUEPRINT_DEV_OPEN=true in local .env for dev-only access (never ship to prod).
 */
export function parseAdminEmails(): Set<string> {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function canAccessBlueprint(user: { email?: string } | null | undefined): boolean {
  if (import.meta.env.VITE_BLUEPRINT_DEV_OPEN === "true" && import.meta.env.DEV) {
    return true;
  }
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return parseAdminEmails().has(email);
}
