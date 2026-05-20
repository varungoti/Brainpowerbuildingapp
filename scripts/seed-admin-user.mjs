/**
 * Creates or updates a Supabase Auth user and grants admin_users role.
 *
 * Usage:
 *   pnpm run admin:seed-user
 *   ADMIN_EMAIL=varungoti@gmail.com ADMIN_ROLE=superadmin pnpm run admin:seed-user
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + project URL in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

const url =
  normalizeSupabaseUrl(process.env.SUPABASE_URL) ||
  normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL) ||
  normalizeSupabaseUrl(process.env.VITE_SUPABASE_PROJECT_ID);
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const email = (process.env.ADMIN_EMAIL ?? "varungoti@gmail.com").trim().toLowerCase();
const role = (process.env.ADMIN_ROLE ?? "superadmin").trim();
const password = process.env.ADMIN_PASSWORD?.trim();

const allowedRoles = new Set(["superadmin", "analyst", "support", "marketing", "readonly"]);
if (!allowedRoles.has(role)) {
  console.error(`Invalid ADMIN_ROLE: ${role}`);
  process.exit(1);
}

if (!url || !serviceRole) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or project URL.\n" +
      "Add SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_PROJECT_ID (or SUPABASE_URL) to .env.local.",
  );
  process.exit(1);
}

const sb = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;

const { data: listed, error: listErr } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error("listUsers failed:", listErr.message);
  process.exit(1);
}
const existing = listed.users.find((u) => u.email?.toLowerCase() === email);
if (existing?.id) {
  userId = existing.id;
  console.log(`Found existing auth user: ${email} (${userId})`);
} else if (password && password.length >= 6) {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "NeuroSpark Admin" },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  userId = data.user?.id ?? null;
  console.log(`Created auth user: ${email}`);
} else {
  console.log(
    `No auth user for ${email}. Sign in once on admin (magic link), then re-run this script,\n` +
      `or set ADMIN_PASSWORD (min 6 chars) to create the account now.`,
  );
  process.exit(1);
}

if (!userId) {
  console.error("Could not resolve user id");
  process.exit(1);
}

const { error: upsertErr } = await sb.from("admin_users").upsert(
  {
    user_id: userId,
    email,
    role,
    disabled_at: null,
  },
  { onConflict: "user_id" },
);

if (upsertErr) {
  console.error("admin_users upsert failed:", upsertErr.message);
  console.error("Run: pnpm run supabase:db:push  (migration 00021 also seeds by email when user exists)");
  process.exit(1);
}

console.log(`OK: ${email} → admin_users.role = ${role}`);
console.log("Parent app blueprint access: add to VITE_ADMIN_EMAILS on the web app build (comma-separated).");
