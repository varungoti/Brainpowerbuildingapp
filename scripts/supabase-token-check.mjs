/**
 * Verifies SUPABASE_ACCESS_TOKEN against the Supabase Management API (no token printed).
 * Loads `.env.supabase` then `.env.local` (same order as run-supabase-cli.mjs).
 */
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
    process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

applyEnvFile(resolve(root, ".env.supabase"));
applyEnvFile(resolve(root, ".env.local"));

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("supabase-token-check: missing SUPABASE_ACCESS_TOKEN in .env.supabase or .env.local");
  process.exit(1);
}

const res = await fetch("https://api.supabase.com/v1/projects", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
});

if (res.status === 200) {
  console.log("supabase-token-check: OK — management API accepts this token (200).");
  process.exit(0);
}

console.error(
  `supabase-token-check: FAIL — management API returned ${res.status}. Create a new token at https://supabase.com/dashboard/account/tokens and update SUPABASE_ACCESS_TOKEN.`,
);
process.exit(1);
