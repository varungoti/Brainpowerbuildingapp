/**
 * Deploy NeuroSpark web surfaces to Vercel (non-interactive).
 *
 * Projects (slug → dashboard display name):
 *   neurospark       — parent web app (Vite, repo root)
 *   neurospark-admin — Growth / Marketing admin panel (admin/)
 *
 * Prerequisites: VERCEL_TOKEN in .env.local (or env).
 * Optional: VITE_* vars already set on each Vercel project via dashboard or `vercel env add`.
 *
 * Usage:
 *   node scripts/vercel-deploy.mjs           # both projects
 *   node scripts/vercel-deploy.mjs app       # neurospark only
 *   node scripts/vercel-deploy.mjs admin     # neurospark-admin only
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE?.trim() || "varubs-projects";

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("Missing VERCEL_TOKEN in .env.local");
  process.exit(1);
}

const target = (process.argv[2] || "all").toLowerCase();

/** @param {{ cwd: string; project: string; label: string }} opts */
function deploy({ cwd, project, label }) {
  console.log(`\n── ${label} (project: ${project}) ──`);
  // Link without auto-detecting monorepo services (which rewrites vercel.json).
  const link = spawnSync(
    "pnpm",
    [
      "dlx",
      "vercel@latest",
      "link",
      "--yes",
      `--token=${token}`,
      `--scope=${scope}`,
      `--project=${project}`,
      "--no-auto-link",
    ],
    { cwd, stdio: "inherit", shell: true, env: { ...process.env, VERCEL_TOKEN: token } },
  );
  if (link.status !== 0) {
    // Older CLI may not support --no-auto-link; retry plain link.
    const retry = spawnSync(
      "pnpm",
      ["dlx", "vercel@latest", "link", "--yes", `--token=${token}`, `--scope=${scope}`, `--project=${project}`],
      { cwd, stdio: "inherit", shell: true, env: { ...process.env, VERCEL_TOKEN: token } },
    );
    if (retry.status !== 0) {
      console.error(`Link failed for ${project}`);
      process.exit(retry.status ?? 1);
    }
    console.warn("Restore vercel.json if CLI injected experimentalServices.");
  }
  const dep = spawnSync(
    "pnpm",
    ["dlx", "vercel@latest", "deploy", "--prod", "--yes", `--token=${token}`, `--scope=${scope}`],
    { cwd, stdio: "inherit", shell: true, env: { ...process.env, VERCEL_TOKEN: token } },
  );
  if (dep.status !== 0) {
    console.error(`Deploy failed for ${project}`);
    process.exit(dep.status ?? 1);
  }
}

if (target === "all" || target === "app" || target === "web") {
  deploy({ cwd: root, project: "neurospark", label: "NeuroSpark (parent app)" });
}
if (target === "all" || target === "admin") {
  deploy({ cwd: resolve(root, "admin"), project: "neurospark-admin", label: "NeuroSpark Admin" });
}

console.log("\nDone. Set display names to “NeuroSpark” / “NeuroSpark Admin” in Vercel → Project Settings if slugs differ.");
