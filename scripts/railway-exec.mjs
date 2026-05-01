/**
 * Run Railway CLI with auth loaded from `.env.local` only (avoids stale RAILWAY_* in the shell).
 *
 * Expects in `.env.local`:
 *   RAILWAY_API_TOKEN=...   (or RAILWAY_TOKEN)
 *   RAILWAY_PROJECT_ID=...   optional; exported for CLI subcommands that read it
 *
 * Usage: node scripts/railway-exec.mjs whoami
 *        node scripts/railway-exec.mjs link -p <project-uuid>
 *        node scripts/railway-exec.mjs up
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localEnv = resolve(root, ".env.local");

function applyEnvFile(path, target) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    target[k] = v;
  }
}

const fileVars = {};
applyEnvFile(localEnv, fileVars);

const childEnv = { ...process.env };
for (const k of Object.keys(childEnv)) {
  if (k.startsWith("RAILWAY")) delete childEnv[k];
}

const token = fileVars.RAILWAY_API_TOKEN || fileVars.RAILWAY_TOKEN;
if (token) {
  childEnv.RAILWAY_TOKEN = token;
  childEnv.RAILWAY_API_TOKEN = token;
}
if (fileVars.RAILWAY_PROJECT_ID) childEnv.RAILWAY_PROJECT_ID = fileVars.RAILWAY_PROJECT_ID;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/railway-exec.mjs <railway-args...>");
  process.exit(1);
}

const r = spawnSync("npx", ["railway", ...args], {
  cwd: root,
  stdio: "inherit",
  env: childEnv,
  shell: true,
});
process.exit(r.status ?? 1);
