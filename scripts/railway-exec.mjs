/**
 * Run Railway CLI with auth from `.env.local`, or use `railway login` session only.
 *
 * `.env.local`:
 *   RAILWAY_ACCOUNT_API_TOKEN=...   (preferred name — Account → API tokens only)
 *   RAILWAY_API_TOKEN=...           (alias)
 *   RAILWAY_TOKEN=...               (alias)
 *   RAILWAY_PROJECT_ID=...          optional
 *   RAILWAY_CLI_USE_LINKED_LOGIN=true   if set: do NOT inject file token; use ~/.railway (browser `railway login`)
 *
 * Usage: node scripts/railway-exec.mjs whoami
 */
import { spawnSync } from "node:child_process";
import {
  defaultLocalEnvPath,
  parseDotEnvFile,
  preferRailwayLinkedLogin,
  resolveRailwayTokenFromVars,
} from "./railway-local-env.mjs";

const root = defaultLocalEnvPath().replace(/[/\\][^/\\]*$/, "");
const localEnv = defaultLocalEnvPath();
const fileVars = parseDotEnvFile(localEnv);

const childEnv = { ...process.env };
for (const k of Object.keys(childEnv)) {
  if (k.startsWith("RAILWAY")) delete childEnv[k];
}

const useLinked = preferRailwayLinkedLogin(fileVars);
const token = useLinked ? "" : resolveRailwayTokenFromVars(fileVars);

if (token) {
  childEnv.RAILWAY_TOKEN = token;
  childEnv.RAILWAY_API_TOKEN = token;
}
if (fileVars.RAILWAY_PROJECT_ID) {
  childEnv.RAILWAY_PROJECT_ID = fileVars.RAILWAY_PROJECT_ID.trim();
}

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
