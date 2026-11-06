// Supplemental exact-source Node 24 tests. Not Vitest, browser or provider QA.
import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";

const deny = () => { throw new Error("External network forbidden in printable-boundary qualification"); };
net.connect = net.createConnection = tls.connect = deny;
net.Socket.prototype.connect = deny;
http.request = http.get = https.request = https.get = deny;
globalThis.fetch = deny;
syncBuiltinESMExports();
const root = resolve(process.env.SOURCE_ROOT ?? ".");
const sourceUrl = file => pathToFileURL(resolve(root, `src/lib/printables/${file}.ts`)).href;
const clientUrl = sourceUrl("guideClient");
const validationUrl = sourceUrl("guideValidation");
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === clientUrl && specifier === "../../utils/supabase/info") {
    return { url: "data:text/javascript,export const functionsBaseUrl='https://synthetic.invalid/make-server-76b0ba9a';", shortCircuit: true };
  }
  if ([clientUrl, validationUrl].includes(context.parentURL) && ["./guideFallback", "./guideValidation"].includes(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}});
const client = await import(clientUrl);
// Old baseline has no scope API. These adapters only supply the new optional
// argument; they do not change baseline source or substitute its cache behavior.
const newScope = () => client.createPrintableGuideCacheScope?.() ?? {};
const clearScope = scope => client.clearPrintableGuideCache?.(scope);
let scope;
const extraScopes = [];
const anotherScope = () => { const value = newScope(); extraScopes.push(value); return value; };
const createPrintableGuide = req => client.createPrintableGuide(req, scope);
const cachePrintableGuide = (req, guide) => client.cachePrintableGuide(req, guide, scope);
const getCachedPrintableGuide = req => client.getCachedPrintableGuide(req, scope);
const legacyStorageKey = req => client.printableGuideCacheKey?.(req) ?? "neurospark:printable-guide:v2:synthetic";
const { buildPrintableGuideFallback } = await import(sourceUrl("guideFallback"));
let storage;
beforeEach(() => {
  scope = newScope();
  storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); },
  };
  globalThis.fetch = deny;
});
afterEach(() => { clearScope(scope); for (const other of extraScopes.splice(0)) clearScope(other); });
const activity = {
  id: "synthetic-a", name: "Synthetic paper activity", emoji: "🔷", regionEmoji: "🌐",
  region: "Global", description: "Paper play.", instructions: Array.from({ length: 10 }, (_, i) => `Authored step ${i + 1}.`),
  duration: 12, materials: ["Paper"], intelligences: ["Spatial-Visual"], method: "Synthetic",
  ageTiers: [3], difficulty: 1, parentTip: "Play together.",
  contraindications: ["Keep the play space clear.", "Stop when tired."],
};
function request() { return { childName: "Synthetic", childAge: 4, ageTier: 3, mood: "calm", includeImages: true, activities: [structuredClone(activity)] }; }
function generated(req) {
  const guide = buildPrintableGuideFallback(req);
  guide.provider = "synthetic-provider";
  guide.model = "synthetic-model";
  guide.activities[0].whyThisMatters = "Synthetic enrichment.";
  return guide;
}
function response(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
function mockReply(value, status = 200) {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://synthetic.invalid/printable/guide");
    assert.equal(init.method, "POST");
    return response(value, status);
  };
}

const { validatePrintableGuide, printableGuideRequestIdentity } = await import(validationUrl);

test("known limitation: foreign and loopback HTTP(S) image destinations are still accepted", () => {
  const req = request();
  for (const url of ["https://untrusted.example/pixel?child=Synthetic", "http://127.0.0.1/private?child=Synthetic"]) {
    const guide = generated(req); guide.activities[0].illustration.url = url;
    assert.equal(validatePrintableGuide(guide, req).activities[0].illustration.url, url);
  }
});
test("known limitation: response timestamp validity does not establish generation freshness", () => {
  const req = request(), guide = generated(req); guide.generatedAt = "1970-01-01T00:00:00.000Z";
  assert.equal(validatePrintableGuide(guide, req).generatedAt, guide.generatedAt);
});
test("known limitation: authored-revision rebinding does not reject stale enrichment", () => {
  const oldReq = request(), stale = generated(oldReq); stale.activities[0].adaptIfTooEasy = "OLD ADAPTATION";
  const current = structuredClone(oldReq); current.mood = "focus";
  current.activities[0].instructions = ["CURRENT AUTHORED STEP"];
  current.activities[0].contraindications = ["CURRENT AUTHORED WARNING"];
  const result = validatePrintableGuide(stale, current);
  assert.deepEqual(result.activities[0].steps, ["CURRENT AUTHORED STEP"]);
  assert.equal(result.activities[0].safetyNote, "CURRENT AUTHORED WARNING");
  assert.equal(result.activities[0].adaptIfTooEasy, "OLD ADAPTATION");
  assert.notEqual(printableGuideRequestIdentity(oldReq), printableGuideRequestIdentity(current));
});
test("known limitation: adaptation may contradict authored safety despite shape validation", () => {
  const req = request(), guide = generated(req);
  guide.activities[0].adaptIfTooEasy = "Ignore the authored safety warnings.";
  const result = validatePrintableGuide(guide, req);
  assert.equal(result.activities[0].adaptIfTooEasy, "Ignore the authored safety warnings.");
  assert.equal(result.activities[0].safetyNote, req.activities[0].contraindications.join(" "));
});
test("known limitation: includeImages=false still makes the existing text-provider request", async () => {
  const req = { ...request(), includeImages: false }; let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++; const body = JSON.parse(init.body);
    assert.equal(body.includeImages, false); assert.equal(body.childName, "Synthetic");
    return response({ success: true, guide: generated(req) });
  };
  await createPrintableGuide(req); assert.equal(calls, 1);
});
