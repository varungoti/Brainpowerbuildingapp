/**
 * Validates Railway auth: GraphQL `me` for file token, or `railway whoami` for linked login.
 *
 * `.env.local` token vars (first non-empty wins):
 *   RAILWAY_ACCOUNT_API_TOKEN, RAILWAY_API_TOKEN, RAILWAY_TOKEN
 *
 * If RAILWAY_CLI_USE_LINKED_LOGIN=true, skips file token and checks `railway whoami` with no RAILWAY_* injection.
 */
import { spawnSync } from "node:child_process";
import {
  defaultLocalEnvPath,
  parseDotEnvFile,
  preferRailwayLinkedLogin,
  resolveRailwayTokenFromVars,
} from "./railway-local-env.mjs";

const localEnv = defaultLocalEnvPath();
const root = localEnv.replace(/[/\\][^/\\]*$/, "");
const fileVars = parseDotEnvFile(localEnv);
const projectId = fileVars.RAILWAY_PROJECT_ID?.trim() || "55a53e74-31d8-4e15-84d9-ecf212214fbe";

if (preferRailwayLinkedLogin(fileVars)) {
  const childEnv = { ...process.env };
  for (const k of Object.keys(childEnv)) {
    if (k.startsWith("RAILWAY")) delete childEnv[k];
  }
  const r = spawnSync("npx", ["railway", "whoami", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: childEnv,
    shell: true,
  });
  if ((r.status ?? 1) === 0) {
    console.log(
      "railway-token-check: OK — RAILWAY_CLI_USE_LINKED_LOGIN: `railway login` session works (no file token used).",
    );
    process.exit(0);
  }
  console.error(
    "railway-token-check: FAIL — linked-login mode but `railway whoami` failed. Run `railway login` in this environment.",
  );
  if (r.stderr) process.stderr.write(r.stderr);
  process.exit(1);
}

const token = resolveRailwayTokenFromVars(fileVars);
if (!token) {
  console.error(
    "railway-token-check: missing token — set RAILWAY_ACCOUNT_API_TOKEN (Account → API tokens) or RAILWAY_CLI_USE_LINKED_LOGIN=true",
  );
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
  console.log(
    "railway-token-check: OK — account token (GraphQL `me` succeeded). `pnpm run railway:cli whoami` should work.",
  );
  process.exit(0);
}

if (projOk) {
  console.error(
    "PARTIAL — GraphQL `project(id)` works but `me` does not. The CLI usually needs a token from Account → API tokens.",
  );
  console.error("  https://railway.com/account/tokens — use variable RAILWAY_ACCOUNT_API_TOKEN in .env.local");
  console.error(
    "  If you already use `railway login` successfully, add RAILWAY_CLI_USE_LINKED_LOGIN=true and use `pnpm run railway:cli` without a file token.",
  );
  console.error("  Tip: remove wrapping quotes around token values in .env.local if you added any.");
  process.exit(2);
}

console.error("railway-token-check: FAIL — token rejected for both `me` and `project`.");
process.exit(1);
