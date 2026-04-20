/**
 * Kokoro voice service auth proxy.
 *
 * Wraps the upstream remsky/Kokoro-FastAPI container with:
 *   - bearer-token auth
 *   - IP allowlist (CIDR)
 *   - request logging
 *   - simple per-token monthly char ledger (in-memory; persistence is callers' job)
 *
 * Exposed routes (passthrough to Kokoro-FastAPI):
 *   POST /v1/audio/speech                 -> proxied
 *   POST /v1/audio/speech/timestamps      -> proxied (per-word JSON)
 *   GET  /v1/audio/voices                 -> proxied
 *   GET  /healthz                         -> local
 */
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

const app = new Hono();
app.use("*", logger());

const KOKORO_UPSTREAM = process.env.KOKORO_UPSTREAM ?? "http://127.0.0.1:8881";
const KOKORO_TOKEN = process.env.KOKORO_TOKEN ?? "change-me";
const ALLOWLIST = (process.env.ALLOWLIST_CIDRS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const charLedger = new Map<string, number>();

function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) return ip === cidr;
  const [base, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  if (!base || Number.isNaN(bits)) return false;
  const ipNum = ipToNum(ip);
  const baseNum = ipToNum(base);
  if (ipNum === null || baseNum === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

function ipToNum(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  const auth = c.req.header("authorization") ?? "";
  if (auth !== `Bearer ${KOKORO_TOKEN}`) return c.text("unauthorized", 401);

  if (ALLOWLIST.length > 0) {
    const xff = c.req.header("x-forwarded-for") ?? "";
    const ip = xff.split(",")[0]?.trim() || "";
    const ok = ip && ALLOWLIST.some((cidr) => ipInCidr(ip, cidr));
    if (!ok) return c.text("forbidden", 403);
  }
  return next();
});

app.get("/healthz", async (c) => {
  try {
    const r = await fetch(`${KOKORO_UPSTREAM}/v1/audio/voices`);
    return c.json({ status: r.ok ? "ok" : "degraded", upstream: r.status });
  } catch (err) {
    return c.json({ status: "error", message: (err as Error).message }, 503);
  }
});

async function proxy(c: { req: { url: string; method: string; raw: Request } }, ledgerKey?: string) {
  const url = new URL(c.req.url);
  const upstreamUrl = `${KOKORO_UPSTREAM}${url.pathname}${url.search}`;
  const init: RequestInit = {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : c.req.raw.body,
  };
  // @ts-expect-error duplex required for streaming bodies in Node fetch
  if (init.body) init.duplex = "half";
  const upstream = await fetch(upstreamUrl, init);
  if (ledgerKey) {
    const len = Number(c.req.raw.headers.get("x-input-chars") ?? 0);
    if (len > 0) charLedger.set(ledgerKey, (charLedger.get(ledgerKey) ?? 0) + len);
  }
  return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
}

app.all("/v1/audio/speech", (c) => proxy(c as never, "speech"));
app.all("/v1/audio/speech/timestamps", (c) => proxy(c as never, "speech_ts"));
app.all("/v1/audio/voices", (c) => proxy(c as never));
app.get("/admin/ledger", (c) => c.json(Object.fromEntries(charLedger)));

const PORT = Number(process.env.PORT ?? 8880);
serve({ fetch: app.fetch, port: PORT });
console.log(`[voice-svc-kokoro] listening on :${PORT} -> ${KOKORO_UPSTREAM}`);

export default app;
