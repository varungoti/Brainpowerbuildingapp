import { defaultLocalEnvPath, parseDotEnvFile, resolveRailwayTokenFromVars } from "./railway-local-env.mjs";

const root = defaultLocalEnvPath().replace(/[/\\][^/\\]*$/, "");
const localEnv = defaultLocalEnvPath();
const projectId = process.argv[2] || "55a53e74-31d8-4e15-84d9-ecf212214fbe";

const fileVars = parseDotEnvFile(localEnv);
const token = resolveRailwayTokenFromVars(fileVars);
if (!token) {
  console.error(
    "railway-list-project: set RAILWAY_ACCOUNT_API_TOKEN or RAILWAY_API_TOKEN in .env.local (GraphQL needs a token).",
  );
  process.exit(1);
}
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
