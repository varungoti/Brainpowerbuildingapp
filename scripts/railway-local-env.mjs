/**
 * Shared helpers for Railway env in `.env.local` (no secrets logged).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Strip CR, outer quotes (common .env mistake), trim. */
export function normalizeEnvValue(raw) {
  let v = raw.replace(/\r/g, "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Parse KEY=VAL lines into a plain object (last key wins). */
export function parseDotEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = normalizeEnvValue(t.slice(eq + 1));
    out[k] = v;
  }
  return out;
}

/**
 * Account-scoped tokens should use `RAILWAY_ACCOUNT_API_TOKEN` (explicit).
 * Also accepts `RAILWAY_API_TOKEN` / `RAILWAY_TOKEN` for backward compatibility.
 */
export function resolveRailwayTokenFromVars(fileVars) {
  const order = [
    "RAILWAY_ACCOUNT_API_TOKEN",
    "RAILWAY_API_TOKEN",
    "RAILWAY_TOKEN",
  ];
  for (const k of order) {
    const v = fileVars[k];
    if (v && String(v).trim()) return normalizeEnvValue(String(v));
  }
  return "";
}

export function preferRailwayLinkedLogin(fileVars) {
  const v = (fileVars.RAILWAY_CLI_USE_LINKED_LOGIN || "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes";
}

export function defaultLocalEnvPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
}
