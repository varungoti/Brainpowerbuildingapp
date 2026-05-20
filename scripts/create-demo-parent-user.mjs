/**
 * Creates (or confirms) a Supabase Auth user for QA / dogfood demos.
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY in `.env.local` (never commit). Dashboard → Settings → API → service_role.
 *   - Project URL via SUPABASE_URL or VITE_SUPABASE_PROJECT_ID (same as web app).
 *
 * Usage:
 *   pnpm run demo:create-user
 *   DEMO_PARENT_EMAIL=demo.parent@example.com DEMO_PARENT_PASSWORD='SecureDemo123!' pnpm run demo:create-user
 *
 * Then optionally add to `.env.local` for one-tap demo login on internal APK builds only:
 *   VITE_SHOW_DEMO_LOGIN=true
 *   VITE_DEMO_LOGIN_EMAIL=demo.parent@example.com
 *   VITE_DEMO_LOGIN_PASSWORD=SecureDemo123!
 *
 * Never ship Play builds with VITE_SHOW_DEMO_LOGIN=true (credentials would be extractable from the APK).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function applyEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[k] = v;
  }
}

applyEnvFile(resolve(root, ".env"));
applyEnvFile(resolve(root, ".env.local"));

function normalizeSupabaseUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, "");
  return `https://${v}.supabase.co`;
}

const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const url =
  normalizeSupabaseUrl(process.env.SUPABASE_URL) ||
  normalizeSupabaseUrl(process.env.VITE_SUPABASE_PROJECT_ID);

const email =
  process.env.DEMO_PARENT_EMAIL?.trim() || "demo.parent@neurospark.local";
const password =
  process.env.DEMO_PARENT_PASSWORD?.trim() || "NeuroSparkDemo2026!";

if (!url || !serviceRole) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or project URL.\n" +
      "Set SUPABASE_URL or VITE_SUPABASE_PROJECT_ID plus SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error("DEMO_PARENT_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

const sb = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "Demo Parent" },
});

if (error) {
  const msg = error.message?.toLowerCase?.() ?? "";
  if (msg.includes("already") || msg.includes("registered")) {
    console.warn(
      `User ${email} already exists. Sign in with that password, or set a new password in Supabase Dashboard → Authentication.`,
    );
    process.exit(0);
  }
  console.error("createUser failed:", error.message);
  process.exit(1);
}

console.log("Demo parent user ready.");
console.log("  Email:", email);
console.log("  Password: same as DEMO_PARENT_PASSWORD env, or default NeuroSparkDemo2026!");
console.log("\nSupabase Dashboard → Authentication: disable email confirmation for smoother QA, or confirm via inbox.");
console.log("\nCoach / AI parent content uses Fireworks when Edge secret FIREWORKS_API_KEY is set — see docs/DEMO_ACCOUNT.md");
