import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localEnv = resolve(root, ".env.local");
const projectId = process.argv[2] || "55a53e74-31d8-4e15-84d9-ecf212214fbe";

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
const query = `query Q($id: String!) {
  project(id: $id) {
    id
    name
    environments {
      edges { node { id name } }
    }
    services {
      edges { node { id name } }
    }
  }
}`;

const res = await fetch("https://backboard.railway.app/graphql/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ query, variables: { id: projectId } }),
});
const j = await res.json();
console.log(JSON.stringify(j.data?.project ?? j.errors, null, 2));
