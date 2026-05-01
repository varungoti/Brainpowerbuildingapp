/**
 * Loads `SUPABASE_ACCESS_TOKEN` from `.env.supabase`, then applies overrides from `.env.local`.
 * Usage: node scripts/run-supabase-cli.mjs projects list
 *        node scripts/run-supabase-cli.mjs link --project-ref YOUR_REF
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = resolve(root, ".env.supabase");
const localEnv = resolve(root, ".env.local");

function applyEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    process.env[k] = v;
  }
}

if (!existsSync(envFile)) {
  console.error("Missing .env.supabase (see .env.example).");
  process.exit(1);
}
applyEnvFile(envFile);
/** Let `.env.local` override tokens and project hints (single place to update locally). */
applyEnvFile(localEnv);
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-supabase-cli.mjs <supabase-args...>");
  process.exit(1);
}
const r = spawnSync("npx", ["supabase", ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});
process.exit(r.status ?? 1);
