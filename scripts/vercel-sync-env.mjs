/**
 * Push Supabase-related VITE_* vars from .env.local to a linked Vercel project.
 * Usage: node scripts/vercel-sync-env.mjs neurospark-admin
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const project = process.argv[2];
const scope = process.env.VERCEL_SCOPE?.trim() || "varubs-projects";

if (!project) {
  console.error("Usage: node scripts/vercel-sync-env.mjs <vercel-project-slug>");
  process.exit(1);
}

const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const token = env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("Missing VERCEL_TOKEN in .env.local");
  process.exit(1);
}

function normalizeUrl(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, "");
  return `https://${v}.supabase.co`;
}

const supabaseUrl = normalizeUrl(env.VITE_SUPABASE_URL) || normalizeUrl(env.VITE_SUPABASE_PROJECT_ID);
const anon = env.VITE_SUPABASE_ANON_KEY?.trim();
if (!supabaseUrl || !anon) {
  console.error("Need VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID plus VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const edgeBase = `${supabaseUrl}/functions/v1/server`;
const cwd = project === "neurospark-admin" ? resolve(root, "admin") : root;

const vars = {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_PROJECT_ID: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: anon,
  ...(project === "neurospark-admin" ? { VITE_EDGE_BASE_URL: edgeBase } : {}),
  ...(project === "neurospark" && env.VITE_ADMIN_EMAILS
    ? { VITE_ADMIN_EMAILS: env.VITE_ADMIN_EMAILS }
    : project === "neurospark"
      ? { VITE_ADMIN_EMAILS: "varungoti@gmail.com" }
      : {}),
};

spawnSync(
  "pnpm",
  ["dlx", "vercel@latest", "link", "--yes", `--token=${token}`, `--scope=${scope}`, `--project=${project}`],
  { cwd, stdio: "inherit", shell: true },
);

for (const [name, value] of Object.entries(vars)) {
  console.log(`Setting ${name} on ${project}…`);
  const r = spawnSync(
    "pnpm",
    [
      "dlx",
      "vercel@latest",
      "env",
      "add",
      name,
      "production",
      `--token=${token}`,
      `--scope=${scope}`,
      "--yes",
      "--force",
    ],
    { cwd, input: value, encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    console.error(`Failed to set ${name}`);
    process.exit(r.status ?? 1);
  }
}

console.log(`OK: synced env to ${project}. Redeploy: node scripts/vercel-deploy.mjs ${project === "neurospark-admin" ? "admin" : "app"}`);
