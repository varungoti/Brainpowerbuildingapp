/**
 * Classifies Railway token: project-scoped tokens work for GraphQL `project(id)` but NOT for CLI (`whoami`, `up`).
 * Loads `.env.local`: RAILWAY_API_TOKEN or RAILWAY_TOKEN, RAILWAY_PROJECT_ID (optional).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localEnv = resolve(root, ".env.local");

const fileVars = {};
if (existsSync(localEnv)) {
  for (const line of readFileSync(localEnv, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    fileVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

const token = fileVars.RAILWAY_API_TOKEN || fileVars.RAILWAY_TOKEN;
const projectId = fileVars.RAILWAY_PROJECT_ID?.trim() || "55a53e74-31d8-4e15-84d9-ecf212214fbe";

if (!token) {
  console.error("railway-token-check: missing RAILWAY_API_TOKEN or RAILWAY_TOKEN in .env.local");
  process.exit(1);
}

async function gql(body) {
  const res = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { res, json: await res.json() };
}

const me = await gql({ query: "{ me { email } }" });
const meOk = me.res.ok && me.json.data?.me?.email && !me.json.errors?.length;

const proj = await gql({
  query: `query Q($id: String!) { project(id: $id) { id name } }`,
  variables: { id: projectId },
});
const projOk =
  proj.res.ok && proj.json.data?.project?.id && !proj.json.errors?.length;

if (meOk) {
  console.log("railway-token-check: OK — account token (CLI + API). `pnpm run railway:cli whoami` should work.");
  process.exit(0);
}

if (projOk) {
  console.error(
    "railway-token-check: PARTIAL — this is a project token (or limited scope): GraphQL can read project, but Railway CLI will stay Unauthorized.",
  );
  console.error(
    "  Note: Account API tokens are created only under Account → Tokens (https://railway.com/account/tokens). Tokens copied from Project Settings are project-scoped (often UUID-shaped) and will always show PARTIAL here.",
  );
  console.error(
    "  Fix: create an Account API Token at https://railway.com/account/tokens (not the Project token from Project Settings) and set RAILWAY_API_TOKEN in .env.local.",
  );
  console.error("  Or: connect the repo in the Railway dashboard and deploy via Git push (no CLI upload).");
  process.exit(2);
}

console.error("railway-token-check: FAIL — token rejected for both account and project APIs.");
console.error("  Replace RAILWAY_API_TOKEN with a new token from Railway.");
process.exit(1);
