// Supplemental exact-source Node 24 checks, not Vitest, Deno or rendered-print QA.
// Run from the repo root. SOURCE_ROOT may select the unchanged baseline.
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";

const denyNetwork = () => { throw new Error("Network disabled for printable-fidelity qualification"); };
net.connect = net.createConnection = tls.connect = denyNetwork;
net.Socket.prototype.connect = denyNetwork;
http.request = http.get = https.request = https.get = denyNetwork;
globalThis.fetch = denyNetwork;
syncBuiltinESMExports();

const root = resolve(process.env.SOURCE_ROOT ?? ".");
const clientUrl = pathToFileURL(resolve(root, "src/lib/printables/guideFallback.ts")).href;
const serverUrl = pathToFileURL(resolve(root, "supabase/functions/server/printable_guide.ts")).href;
const providerStub = "data:text/javascript," + encodeURIComponent(`
  export async function chatJson() { return null; }
  export async function generateImage() { throw new Error('Image generation forbidden in qualification'); }
`);
const schemaStub = "data:text/javascript,export const printableGuideSchema = {};";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === serverUrl) {
      if (specifier === "./ai_provider.ts") return { url: providerStub, shortCircuit: true };
      if (specifier === "./ai_schemas.ts") return { url: schemaStub, shortCircuit: true };
      throw new Error(`Unexpected server dependency: ${specifier}`);
    }
    return nextResolve(specifier, context);
  },
});
const client = await import(clientUrl);
const server = await import(serverUrl);
const activity = {
  id: "synthetic-printable", name: "Synthetic paper shapes", emoji: "🔷",
  regionEmoji: "🌐", region: "Global", description: "Sort paper shapes.",
  instructions: Array.from({ length: 10 }, (_, i) => `Authored step ${i + 1}.`),
  duration: 12, materials: ["Paper"], intelligences: ["Spatial-Visual"],
  method: "Synthetic", ageTiers: [3], difficulty: 1, parentTip: "Play together.",
  contraindications: ["Keep the play space clear.", "Stop when tired.", "Put materials away afterward."],
};
const request = (activities = [activity]) => ({ childName: "Synthetic", ageTier: 3, activities });

for (const [name, module] of [["client", client], ["server", server]]) {
  const build = activities => module.buildPrintableGuideFallback(request(activities));
  test(`${name}: preserves every authored step in order, including step ten`, () => {
    assert.deepEqual(build().activities[0].steps, activity.instructions);
  });
  test(`${name}: step output is a copy rather than mutable source alias`, () => {
    const input = structuredClone(activity);
    const guide = build([input]);
    guide.activities[0].steps[0] = "Changed by consumer";
    assert.equal(input.instructions[0], activity.instructions[0]);
  });
  test(`${name}: retains all warnings in their authored order`, () => {
    assert.equal(build().activities[0].safetyNote, activity.contraindications.join(" "));
  });
  test(`${name}: a blank first warning cannot hide a later warning`, () => {
    assert.equal(build([{ ...activity, contraindications: ["  ", "Keep away from heat."] }]).activities[0].safetyNote,
      "Keep away from heat.");
  });
  test(`${name}: absent, empty and whitespace-only warnings keep generic supervision`, () => {
    for (const contraindications of [undefined, [], [" ", "\n", "\t"]]) {
      assert.match(build([{ ...activity, contraindications }]).activities[0].safetyNote, /Supervise closely/);
    }
  });
  test(`${name}: trims blank entries and deduplicates exact repeated warnings`, () => {
    const guide = build([{ ...activity, contraindications: ["  Stop when tired. ", "", "Stop when tired.", "Keep space clear."] }]);
    assert.equal(guide.activities[0].safetyNote, "Stop when tired. Keep space clear.");
  });
  test(`${name}: preserves non-Latin warning text and punctuation`, () => {
    const warning = "वयस्क की निगरानी में खेलें।";
    assert.equal(build([{ ...activity, contraindications: [warning] }]).activities[0].safetyNote, warning);
  });
  test(`${name}: preserves valid warnings around malformed JSON entries`, () => {
    const contraindications = ["First caution.", null, 42, {}, [], true, "Last caution."];
    assert.equal(build([{ ...activity, contraindications }]).activities[0].safetyNote,
      "First caution. Last caution.");
  });
  test(`${name}: rejects non-array warning collections without throwing`, () => {
    for (const contraindications of [null, "Not an array", 42, true, { 0: "Not an array" }]) {
      assert.match(build([{ ...activity, contraindications }]).activities[0].safetyNote, /Supervise closely/);
    }
  });
  test(`${name}: all malformed warning entries fall back to supervision`, () => {
    const contraindications = [null, false, 42, {}, []];
    assert.match(build([{ ...activity, contraindications }]).activities[0].safetyNote, /Supervise closely/);
  });
  test(`${name}: multiple activities retain their own steps and warnings`, () => {
    const second = { ...activity, id: "synthetic-second", instructions: ["Second activity only."], contraindications: ["Second caution.", "Another second caution."] };
    const guide = build([activity, second]);
    assert.deepEqual(guide.activities.map(a => a.activityId), [activity.id, second.id]);
    assert.deepEqual(guide.activities.map(a => a.steps), [activity.instructions, second.instructions]);
    assert.deepEqual(guide.activities.map(a => a.safetyNote), [activity.contraindications.join(" "), second.contraindications.join(" ")]);
  });
  test(`${name}: does not mutate source arrays or warning text`, () => {
    const input = structuredClone(activity);
    const before = structuredClone(input);
    Object.freeze(input.instructions);
    Object.freeze(input.contraindications);
    Object.freeze(input);
    build([input]);
    assert.deepEqual(input, before);
  });
  test(`${name}: keeps empty packs and ordinary guide metadata compatible`, () => {
    assert.deepEqual(build([]).activities, []);
    const guide = build();
    assert.equal(guide.totalMinutes, 12);
    assert.equal(guide.childName, "Synthetic");
    assert.equal(guide.ageTier, 3);
    assert.equal(guide.provider, "fallback");
    assert.equal(guide.model, "deterministic");
    assert.match(guide.footer, /not diagnosis/);
  });
}
test("server: optional instruction defaults stay available", () => {
  const guide = server.buildPrintableGuideFallback(request([{ ...activity, instructions: undefined }]));
  assert.deepEqual(guide.activities[0].steps, ["Invite your child to try the activity.", "Model once, then let them lead."]);
});
test("server: provider-null generation with images disabled uses the complete fallback", async () => {
  const guide = await server.generatePrintableGuide({ ...request(), includeImages: false });
  assert.deepEqual(guide.activities[0].steps, activity.instructions);
  assert.equal(guide.activities[0].safetyNote, activity.contraindications.join(" "));
  assert.equal(guide.provider, "fallback");
});
