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

test("valid matching cache entries round trip without network", async () => {
  const req = request();
  cachePrintableGuide(req, generated(req));
  assert.equal(getCachedPrintableGuide(req).activities[0].whyThisMatters, "Synthetic enrichment.");
  assert.equal((await createPrintableGuide(req)).provider, "synthetic-provider");
});
test("legacy unwrapped cached guides are ignored", () => {
  const req = request();
  storage.set(legacyStorageKey(req), JSON.stringify(generated(req)));
  assert.equal(getCachedPrintableGuide(req), null);
});
test("primitive, array and malformed cache values are rejected", () => {
  const req = request();
  for (const raw of ['"unexpected"', '42', 'true', '[]', '{}', '{']) {
    storage.set(legacyStorageKey(req), raw);
    assert.equal(getCachedPrintableGuide(req), null);
  }
});
test("identical requests cannot read another account/child scope", () => {
  const req = request(); cachePrintableGuide(req, generated(req));
  assert.equal(client.getCachedPrintableGuide(req, anotherScope()), null);
  assert.equal(getCachedPrintableGuide(req).provider, "synthetic-provider");
});
const changes = [
  ["child age", r => { r.childAge++; }],
  ["mood", r => { r.mood = "focus"; }],
  ["image preference", r => { r.includeImages = false; }],
  ["instructions", r => { r.activities[0].instructions.push("New cleanup step."); }],
  ["warnings", r => { r.activities[0].contraindications.push("New caution."); }],
  ["materials", r => { r.activities[0].materials.push("Cardboard"); }],
  ["parent tip", r => { r.activities[0].parentTip = "Updated guidance."; }],
  ["illustration icon", r => { r.activities[0].emoji = "🟪"; }],
];
for (const [label, change] of changes) test(`cache invalidates when ${label} changes`, () => {
  const req = request();
  cachePrintableGuide(req, generated(req));
  change(req);
  assert.equal(getCachedPrintableGuide(req), null);
});
test("non-Latin names cannot reuse each other's guide", () => {
  const first = { ...request(), childName: "आरव" };
  const second = { ...request(), childName: "美咲" };
  cachePrintableGuide(first, generated(first));
  assert.equal(getCachedPrintableGuide(second), null);
});
test("forceRefresh is not part of cache identity; missing includeImages means true", () => {
  const req = request();
  cachePrintableGuide(req, generated(req));
  assert.equal(getCachedPrintableGuide({ ...req, forceRefresh: true }).provider, "synthetic-provider");
  assert.equal(getCachedPrintableGuide({ ...req, includeImages: undefined }).provider, "synthetic-provider");
});
test("cache reads and writes fail quietly if storage is unavailable", () => {
  const req = request();
  globalThis.localStorage = { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("quota"); } };
  assert.equal(getCachedPrintableGuide(req), null);
  assert.doesNotThrow(() => cachePrintableGuide(req, generated(req)));
});
test("invalid guides are not written to cache", () => {
  const req = request();
  cachePrintableGuide(req, { unexpected: true });
  assert.equal(storage.size, 0);
});
test("valid responses keep enrichment but retain authored steps and warnings", async () => {
  const req = request();
  const guide = generated(req);
  guide.activities[0].steps = ["Incomplete generated steps."];
  guide.activities[0].safetyNote = "Generic generated caution.";
  guide.activities[0].materials = ["Unrequested material"];
  guide.title = "Unrelated generated title";
  guide.footer = "Generated footer without the disclaimer";
  mockReply({ success: true, guide });
  const result = await createPrintableGuide(req);
  assert.equal(result.provider, "synthetic-provider");
  assert.equal(result.activities[0].whyThisMatters, "Synthetic enrichment.");
  assert.deepEqual(result.activities[0].steps, activity.instructions);
  assert.equal(result.activities[0].safetyNote, activity.contraindications.join(" "));
  assert.deepEqual(result.activities[0].materials, activity.materials);
  assert.match(result.title, /^Synthetic's/);
  assert.match(result.footer, /not diagnosis/);
});
test("unsuccessful and malformed response envelopes fall back", async () => {
  const req = { ...request(), forceRefresh: true };
  for (const value of [null, [], true, {}, { guide: generated(req) }, { success: false, guide: generated(req) }, { success: "true", guide: generated(req) }]) {
    mockReply(value);
    assert.equal((await createPrintableGuide(req)).provider, "fallback");
  }
});
test("mismatched guide identity or activity membership falls back", async () => {
  const req = { ...request(), forceRefresh: true };
  const mutations = [
    g => { g.id = "another"; }, g => { g.packHash = "another"; },
    g => { g.childName = "Other"; }, g => { g.childAge++; }, g => { g.ageTier++; },
    g => { g.totalMinutes++; }, g => { g.activities[0].activityId = "another"; },
    g => { g.activities[0].duration++; }, g => { g.activities.push(structuredClone(g.activities[0])); },
  ];
  for (const mutate of mutations) {
    const guide = generated(req); mutate(guide); mockReply({ success: true, guide });
    assert.equal((await createPrintableGuide(req)).provider, "fallback");
  }
});
test("malformed nested display fields fall back without rendering crashes", async () => {
  const req = { ...request(), forceRefresh: true };
  const mutations = [
    g => { g.routine = null; }, g => { g.materials = {}; }, g => { g.prepChecklist = [null]; },
    g => { g.activities = null; }, g => { g.activities = [null]; },
    g => { g.activities[0].steps = null; }, g => { g.activities[0].sayThis = [42]; },
    g => { g.activities[0].illustration = {}; }, g => { g.activities[0].whyThisMatters = {}; },
    g => { g.generatedAt = "not-a-date"; },
  ];
  for (const mutate of mutations) {
    const guide = generated(req); mutate(guide); mockReply({ success: true, guide });
    assert.equal((await createPrintableGuide(req)).provider, "fallback");
  }
});
test("network errors, HTTP errors and invalid JSON use the complete fallback", async () => {
  const req = { ...request(), forceRefresh: true };
  const replies = [async () => { throw Error("offline"); }, async () => response({}, 503), async () => new Response("{not-json")];
  for (const reply of replies) {
    globalThis.fetch = reply;
    const guide = await createPrintableGuide(req);
    assert.equal(guide.provider, "fallback");
    assert.deepEqual(guide.activities[0].steps, activity.instructions);
    assert.equal(guide.activities[0].safetyNote, activity.contraindications.join(" "));
  }
});
test("forced refresh bypasses cache and sends no local cache control", async () => {
  const req = request();
  cachePrintableGuide(req, generated(req));
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(JSON.parse(init.body).forceRefresh, undefined);
    return response({ success: true, guide: generated(req) });
  };
  assert.equal((await createPrintableGuide({ ...req, forceRefresh: true })).provider, "synthetic-provider");
  assert.equal(calls, 1);
});
test("caller mutation during fetch cannot retarget the cache write", async () => {
  const req = request();
  const original = structuredClone(req);
  let release;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  const pending = createPrintableGuide(req);
  req.childName = "Changed while waiting";
  req.activities[0].instructions.push("New request step.");
  release(response({ success: true, guide: generated(original) }));
  const result = await pending;
  assert.equal(result.childName, original.childName);
  assert.equal(getCachedPrintableGuide(req), null);
  assert.equal(getCachedPrintableGuide(original).childName, original.childName);
});
test("images disabled means no returned image URL, even if the server supplies one", async () => {
  const req = { ...request(), includeImages: false };
  const guide = generated(req); guide.activities[0].illustration.url = "https://synthetic.invalid/image.png";
  mockReply({ success: true, guide });
  assert.equal((await createPrintableGuide(req)).activities[0].illustration.url, undefined);
});
test("unsupported image URLs retain the icon without invalidating valid text", async () => {
  const req = { ...request(), forceRefresh: true };
  for (const url of ["javascript:alert(1)", "data:text/html,example", "relative/path", "https://name:password@synthetic.invalid/image.png"]) {
    const guide = generated(req); guide.activities[0].illustration.url = url;
    mockReply({ success: true, guide });
    const result = await createPrintableGuide(req);
    assert.equal(result.activities[0].illustration.url, undefined);
    assert.equal(result.provider, "synthetic-provider");
  }
});
test("supported raster data and HTTPS images remain available when requested", async () => {
  const req = { ...request(), forceRefresh: true };
  for (const url of ["https://synthetic.invalid/image.png", "data:image/png;base64,AAAA"]) {
    const guide = generated(req); guide.activities[0].illustration.url = url;
    mockReply({ success: true, guide });
    assert.equal((await createPrintableGuide(req)).activities[0].illustration.url, url);
  }
});
test("mutating a cached result cannot corrupt later cache reads", () => {
  const req = request(); cachePrintableGuide(req, generated(req));
  const result = getCachedPrintableGuide(req);
  result.activities[0].illustration.url = "javascript:alert(1)";
  result.activities[0].sayThis.push("Consumer edit");
  result.activities[0].watchFor.push("Consumer edit");
  const again = getCachedPrintableGuide(req);
  assert.equal(again.activities[0].illustration.url, undefined);
  assert.equal(again.activities[0].sayThis.includes("Consumer edit"), false);
  assert.equal(again.activities[0].watchFor.includes("Consumer edit"), false);
});
test("returned cached arrays do not alias the caller's authored content", () => {
  const req = request(); const before = structuredClone(req);
  cachePrintableGuide(req, generated(req));
  const guide = getCachedPrintableGuide(req);
  guide.activities[0].materials.push("Consumer edit");
  guide.activities[0].intelligences.push("Consumer edit");
  guide.activities[0].steps.push("Consumer edit");
  assert.deepEqual(req, before);
});

test("no printable identity or guide is read or written to browser storage", async () => {
  let reads = 0, writes = 0;
  const blockedStorage = { getItem: () => { reads++; throw Error("storage forbidden"); }, setItem: () => { writes++; throw Error("storage forbidden"); } };
  globalThis.localStorage = globalThis.sessionStorage = blockedStorage;
  const req = request(); mockReply({ success: true, guide: generated(req) });
  await createPrintableGuide(req);
  assert.equal(getCachedPrintableGuide(req).provider, "synthetic-provider");
  assert.equal(reads, 0); assert.equal(writes, 0);
});
test("unscoped callers cannot persist or reuse child context", async () => {
  const req = request();
  client.cachePrintableGuide(req, generated(req));
  assert.equal(client.getCachedPrintableGuide(req), null);
  mockReply({ success: true, guide: generated(req) });
  await client.createPrintableGuide(req);
  assert.equal(client.getCachedPrintableGuide(req), null);
  assert.equal(storage.size, 0);
});
test("cache expires after five minutes without sliding on reads", () => {
  const req = request(); const now = Date.now;
  try {
    let time = 1_000_000; Date.now = () => time;
    cachePrintableGuide(req, generated(req));
    time += 299_999; assert.equal(getCachedPrintableGuide(req).provider, "synthetic-provider");
    time++; assert.equal(getCachedPrintableGuide(req), null);
  } finally { Date.now = now; }
});
test("cache expiration also discards idle entries via its timer", () => {
  const originalSet = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
  let expire; const cleared = [];
  globalThis.setTimeout = (callback, delay) => { assert.equal(delay, 300_000); expire = callback; return 998; };
  globalThis.clearTimeout = timer => cleared.push(timer);
  try {
    const req = request(); cachePrintableGuide(req, generated(req));
    expire(); assert.equal(getCachedPrintableGuide(req), null);
    cachePrintableGuide(req, generated(req)); clearScope(scope);
    assert.deepEqual(cleared, [998]);
  } finally { globalThis.setTimeout = originalSet; globalThis.clearTimeout = originalClear; }
});
test("cache retains at most one request per scope", () => {
  const first = request(), second = { ...request(), mood: "focus" };
  cachePrintableGuide(first, generated(first)); cachePrintableGuide(second, generated(second));
  assert.equal(getCachedPrintableGuide(first), null);
  assert.equal(getCachedPrintableGuide(second).provider, "synthetic-provider");
});
test("newer overlapping refresh wins when older success completes last", async () => {
  const req = { ...request(), forceRefresh: true }, releases = [];
  globalThis.fetch = () => new Promise(resolve => releases.push(resolve));
  const oldRequest = createPrintableGuide(req), newRequest = createPrintableGuide(req);
  const newer = generated(req); newer.activities[0].whyThisMatters = "NEWER RESPONSE";
  releases[1](response({ success: true, guide: newer })); await newRequest;
  const older = generated(req); older.activities[0].whyThisMatters = "OLDER RESPONSE";
  releases[0](response({ success: true, guide: older }));
  assert.equal((await oldRequest).activities[0].whyThisMatters, "OLDER RESPONSE");
  assert.equal(getCachedPrintableGuide(req).activities[0].whyThisMatters, "NEWER RESPONSE");
});
test("older failures cannot overwrite newer success", async () => {
  const req = { ...request(), forceRefresh: true }, pending = [];
  globalThis.fetch = () => new Promise((resolve, reject) => pending.push({ resolve, reject }));
  const older = createPrintableGuide(req), newer = createPrintableGuide(req);
  pending[1].resolve(response({ success: true, guide: generated(req) })); await newer;
  pending[0].reject(Error("offline")); assert.equal((await older).provider, "fallback");
  assert.equal(getCachedPrintableGuide(req).provider, "synthetic-provider");
});
test("newer failure is not overwritten by an older success", async () => {
  const req = { ...request(), forceRefresh: true }, releases = [];
  globalThis.fetch = () => new Promise(resolve => releases.push(resolve));
  const older = createPrintableGuide(req), newer = createPrintableGuide(req);
  releases[1](response({}, 503)); await newer;
  releases[0](response({ success: true, guide: generated(req) })); await older;
  assert.equal(getCachedPrintableGuide(req).provider, "fallback");
});
test("last-started request wins across changed identities in one scope", async () => {
  const oldReq = request(), newReq = { ...request(), mood: "focus" }, releases = [];
  globalThis.fetch = () => new Promise(resolve => releases.push(resolve));
  const older = createPrintableGuide(oldReq), newer = createPrintableGuide(newReq);
  releases[1](response({ success: true, guide: generated(newReq) })); await newer;
  releases[0](response({ success: true, guide: generated(oldReq) })); await older;
  assert.equal(getCachedPrintableGuide(oldReq), null);
  assert.equal(getCachedPrintableGuide(newReq).provider, "synthetic-provider");
});
test("clearing scope discards cached context and prevents pending refill", async () => {
  const req = request(); cachePrintableGuide(req, generated(req)); let release;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  const pending = createPrintableGuide({ ...req, forceRefresh: true });
  clearScope(scope); assert.equal(getCachedPrintableGuide(req), null);
  release(response({ success: true, guide: generated(req) })); await pending;
  assert.equal(getCachedPrintableGuide(req), null);
});
test("cache scope stays local and is not added to provider payload", async () => {
  const req = request();
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    assert.deepEqual(Object.keys(payload).sort(), ["activities", "ageTier", "childAge", "childName", "includeImages", "mood"]);
    return response({ success: true, guide: generated(req) });
  };
  await createPrintableGuide(req);
});
