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


test("expiry read during a pending refresh does not revoke that refresh", async () => {
  const req=request(); const realNow=Date.now; let time=1_000_000, release;
  Date.now=()=>time;
  try {
    cachePrintableGuide(req,generated(req));
    globalThis.fetch=()=>new Promise(resolve=>release=resolve);
    const pending=createPrintableGuide({...req,forceRefresh:true});
    time+=300_000;
    assert.equal(getCachedPrintableGuide(req),null);
    const newer=generated(req); newer.activities[0].whyThisMatters="post-expiry";
    release(response({success:true,guide:newer})); await pending;
    assert.equal(getCachedPrintableGuide(req).activities[0].whyThisMatters,"post-expiry");
  } finally {Date.now=realNow;}
});
test("idle expiration during pending refresh does not revoke its generation", async () => {
  const realSet=globalThis.setTimeout, realClear=globalThis.clearTimeout; let expire, release;
  globalThis.setTimeout=callback=>{expire=callback;return 99;}; globalThis.clearTimeout=()=>{};
  try {
    const req=request(); cachePrintableGuide(req,generated(req));
    globalThis.fetch=()=>new Promise(resolve=>release=resolve);
    const pending=createPrintableGuide({...req,forceRefresh:true});
    expire(); assert.equal(getCachedPrintableGuide(req),null);
    release(response({success:true,guide:generated(req)})); await pending;
    assert.equal(getCachedPrintableGuide(req).provider,"synthetic-provider");
    clearScope(scope);
  } finally {globalThis.setTimeout=realSet;globalThis.clearTimeout=realClear;}
});
test("clear then reuse scope cannot let the old generation overwrite its successor", async () => {
  const req={...request(),forceRefresh:true}, releases=[];
  globalThis.fetch=()=>new Promise(resolve=>releases.push(resolve));
  const older=createPrintableGuide(req);clearScope(scope);
  const newer=createPrintableGuide(req);
  const fresh=generated(req);fresh.activities[0].whyThisMatters="fresh generation";
  releases[1](response({success:true,guide:fresh}));await newer;
  releases[0](response({success:true,guide:generated(req)}));await older;
  assert.equal(getCachedPrintableGuide(req).activities[0].whyThisMatters,"fresh generation");
});
test("old response completing first cannot populate cache while newer remains pending", async () => {
  const req={...request(),forceRefresh:true}, releases=[];
  globalThis.fetch=()=>new Promise(resolve=>releases.push(resolve));
  const older=createPrintableGuide(req), newer=createPrintableGuide(req);
  releases[0](response({success:true,guide:generated(req)}));await older;
  assert.equal(getCachedPrintableGuide(req),null);
  releases[1](response({success:true,guide:generated(req)}));await newer;
  assert.equal(getCachedPrintableGuide(req).provider,"synthetic-provider");
});
test("mutating supplied request/guide after cache write cannot mutate retained content", () => {
  const req=request(), guide=generated(req), original=structuredClone(req);
  cachePrintableGuide(req,guide);
  req.childName="changed";req.activities[0].materials.push("changed");
  guide.activities[0].sayThis.push("changed");guide.activities[0].illustration.url="javascript:alert(1)";
  const cached=getCachedPrintableGuide(original);
  assert.equal(cached.childName,original.childName);
  assert.equal(cached.activities[0].materials.includes("changed"),false);
  assert.equal(cached.activities[0].sayThis.includes("changed"),false);
  assert.equal(cached.activities[0].illustration.url,undefined);
});
test("returned live response cannot mutate retained cache entry", async () => {
  const req=request();mockReply({success:true,guide:generated(req)});
  const live=await createPrintableGuide(req);live.activities[0].sayThis.push("changed");
  live.activities[0].illustration.url="javascript:alert(1)";
  assert.equal(getCachedPrintableGuide(req).activities[0].sayThis.includes("changed"),false);
  assert.equal(getCachedPrintableGuide(req).activities[0].illustration.url,undefined);
});
test("clearing one scope does not revoke concurrent work in another scope", async () => {
  const req=request(), other=anotherScope(), releases=[];
  globalThis.fetch=()=>new Promise(resolve=>releases.push(resolve));
  const first=createPrintableGuide(req), second=client.createPrintableGuide(req,other);
  clearScope(scope);
  releases[1](response({success:true,guide:generated(req)}));await second;
  releases[0](response({success:true,guide:generated(req)}));await first;
  assert.equal(getCachedPrintableGuide(req),null);
  assert.equal(client.getCachedPrintableGuide(req,other).provider,"synthetic-provider");
});
