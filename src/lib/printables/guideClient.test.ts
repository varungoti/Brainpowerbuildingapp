import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "../../app/data/activities";
import type { PrintableGuide, PrintableGuideRequest } from "./guideTypes";

vi.mock("../../utils/supabase/info", () => ({
  functionsBaseUrl: "https://synthetic.invalid/make-server-76b0ba9a",
}));

import { buildPrintableGuideFallback } from "./guideFallback";
import {
  cachePrintableGuide as cacheGuide, createPrintableGuide as createGuide,
  getCachedPrintableGuide as getCachedGuide, createPrintableGuideCacheScope,
  clearPrintableGuideCache, type PrintableGuideCacheScope,
} from "./guideClient";

let scope: PrintableGuideCacheScope;
const extraScopes: PrintableGuideCacheScope[] = [];
const anotherScope = () => { const value = createPrintableGuideCacheScope(); extraScopes.push(value); return value; };
const createPrintableGuide = (req: PrintableGuideRequest) => createGuide(req, scope);
const cachePrintableGuide = (req: PrintableGuideRequest, guide: PrintableGuide) => cacheGuide(req, guide, scope);
const getCachedPrintableGuide = (req: PrintableGuideRequest) => getCachedGuide(req, scope);

const activity: Activity = {
  id: "synthetic-a", name: "Synthetic paper activity", emoji: "🔷", regionEmoji: "🌐",
  region: "Global", description: "Paper play.", instructions: Array.from({ length: 10 }, (_, i) => `Authored step ${i + 1}.`),
  duration: 12, materials: ["Paper"], intelligences: ["Spatial-Visual"], method: "Synthetic",
  ageTiers: [3], difficulty: 1, parentTip: "Play together.",
  contraindications: ["Keep the play space clear.", "Stop when tired."],
};

function request(): PrintableGuideRequest {
  return { childName: "Synthetic", childAge: 4, ageTier: 3, mood: "calm", includeImages: true, activities: [structuredClone(activity)] };
}
function generated(req: PrintableGuideRequest): PrintableGuide {
  const guide = buildPrintableGuideFallback(req);
  guide.provider = "synthetic-provider";
  guide.model = "synthetic-model";
  guide.activities[0].whyThisMatters = "Synthetic enrichment.";
  return guide;
}
function reply(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

let storage: Map<string, string>;
beforeEach(() => {
  scope = createPrintableGuideCacheScope();
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected fetch in synthetic test"); }));
});
afterEach(() => {
  clearPrintableGuideCache(scope);
  for (const other of extraScopes.splice(0)) clearPrintableGuideCache(other);
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("printable guide client boundary", () => {
  it("returns a valid matching cache entry without fetching", async () => {
    const req = request();
    cachePrintableGuide(req, generated(req));
    expect((await createPrintableGuide(req)).activities[0].whyThisMatters).toBe("Synthetic enrichment.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects legacy, malformed and primitive cached values", () => {
    const req = request();
    for (const raw of [JSON.stringify(generated(req)), '"text"', "42", "true", "[]", "{}", "{"]) {
      storage.set("neurospark:printable-guide:v2:synthetic", raw);
      expect(getCachedPrintableGuide(req)).toBeNull();
    }
  });

  it("isolates identical requests between owner/child scopes", () => {
    const req = request(); cachePrintableGuide(req, generated(req));
    expect(getCachedGuide(req, anotherScope())).toBeNull();
    expect(getCachedPrintableGuide(req)?.provider).toBe("synthetic-provider");
  });

  const changes: Array<[string, (req: PrintableGuideRequest) => void]> = [
    ["age", req => { req.childAge = 5; }],
    ["mood", req => { req.mood = "focus"; }],
    ["images", req => { req.includeImages = false; }],
    ["steps", req => { req.activities[0].instructions.push("Cleanup."); }],
    ["warnings", req => { req.activities[0].contraindications!.push("New caution."); }],
    ["materials", req => { req.activities[0].materials.push("Cardboard"); }],
    ["parent guidance", req => { req.activities[0].parentTip = "New guidance."; }],
    ["icon", req => { req.activities[0].emoji = "🟪"; }],
  ];
  it.each(changes)("misses cache when %s changes", (_name, change) => {
    const req = request(); cachePrintableGuide(req, generated(req)); change(req);
    expect(getCachedPrintableGuide(req)).toBeNull();
  });

  it("keeps non-Latin names separate and excludes forceRefresh from identity", () => {
    const first = { ...request(), childName: "आरव" };
    const second = { ...request(), childName: "美咲" };
    cachePrintableGuide(first, generated(first));
    expect(getCachedPrintableGuide(second)).toBeNull();
    expect(getCachedPrintableGuide({ ...first, forceRefresh: true })?.provider).toBe("synthetic-provider");
    expect(getCachedPrintableGuide({ ...first, includeImages: undefined })?.provider).toBe("synthetic-provider");
  });

  it("does not cache invalid guides or throw for unavailable storage", () => {
    const req = request();
    cachePrintableGuide(req, {} as PrintableGuide);
    expect(storage.size).toBe(0);
    vi.stubGlobal("localStorage", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("quota"); } });
    expect(getCachedPrintableGuide(req)).toBeNull();
    expect(() => cachePrintableGuide(req, generated(req))).not.toThrow();
  });

  it("retains authored steps, warnings, materials and disclaimer alongside enrichment", async () => {
    const req = request(); const guide = generated(req);
    guide.activities[0].steps = ["Incomplete generated steps."];
    guide.activities[0].safetyNote = "Generated caution.";
    guide.activities[0].materials = ["Unrequested material"];
    guide.title = "Unrelated title";
    guide.footer = "Missing disclaimer";
    vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide }));
    const result = await createPrintableGuide(req);
    expect(result.provider).toBe("synthetic-provider");
    expect(result.activities[0].whyThisMatters).toBe("Synthetic enrichment.");
    expect(result.activities[0].steps).toEqual(activity.instructions);
    expect(result.activities[0].safetyNote).toBe(activity.contraindications!.join(" "));
    expect(result.activities[0].materials).toEqual(activity.materials);
    expect(result.title).toContain("Synthetic");
    expect(result.footer).toMatch(/not diagnosis/);
  });

  it("rejects unsuccessful responses and mismatched guide identity", async () => {
    const req = { ...request(), forceRefresh: true };
    const guide = generated(req);
    const bodies = [null, [], {}, { guide }, { success: false, guide }, { success: "true", guide },
      { success: true, guide: { ...guide, childName: "Other" } },
      { success: true, guide: { ...guide, packHash: "other" } },
      { success: true, guide: { ...guide, childAge: 99 } },
      { success: true, guide: { ...guide, totalMinutes: 99 } },
      { success: true, guide: { ...guide, activities: [{ ...guide.activities[0], activityId: "other" }] } }];
    for (const body of bodies) {
      vi.mocked(fetch).mockResolvedValue(reply(body));
      expect((await createPrintableGuide(req)).provider).toBe("fallback");
    }
  });

  it("rejects malformed nested render fields", async () => {
    const req = { ...request(), forceRefresh: true };
    const guide = generated(req); const card = guide.activities[0];
    const badGuides = [{ ...guide, routine: null }, { ...guide, activities: [null] },
      { ...guide, materials: {} }, { ...guide, prepChecklist: [null] },
      { ...guide, generatedAt: "bad-date" },
      ...[{ ...card, steps: null }, { ...card, illustration: null }, { ...card, sayThis: [42] }]
        .map(badCard => ({ ...guide, activities: [badCard] }))];
    for (const badGuide of badGuides) {
      vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide: badGuide }));
      expect((await createPrintableGuide(req)).provider).toBe("fallback");
    }
  });

  it("keeps the complete fallback for offline, HTTP and JSON failures", async () => {
    const req = { ...request(), forceRefresh: true };
    vi.mocked(fetch).mockRejectedValueOnce(Error("offline"))
      .mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(new Response("{bad-json"));
    for (let i = 0; i < 3; i++) {
      const result = await createPrintableGuide(req);
      expect(result.provider).toBe("fallback");
      expect(result.activities[0].steps).toEqual(activity.instructions);
      expect(result.activities[0].safetyNote).toBe(activity.contraindications!.join(" "));
    }
  });

  it("forces refresh without sending the local refresh flag", async () => {
    const req = request(); cachePrintableGuide(req, generated(req));
    vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide: generated(req) }));
    await createPrintableGuide({ ...req, forceRefresh: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://synthetic.invalid/printable/guide");
    expect(JSON.parse(init?.body as string).forceRefresh).toBeUndefined();
  });

  it("keeps pending response and cache write tied to the captured request", async () => {
    const req = request(); const original = structuredClone(req);
    let release!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(resolve => { release = resolve; }));
    const pending = createPrintableGuide(req);
    req.childName = "Changed"; req.activities[0].instructions.push("New step.");
    release(reply({ success: true, guide: generated(original) }));
    expect((await pending).childName).toBe(original.childName);
    expect(getCachedPrintableGuide(req)).toBeNull();
    expect(getCachedPrintableGuide(original)?.childName).toBe(original.childName);
  });

  it("uses icon fallback for images-disabled or unsupported URLs", async () => {
    for (const [includeImages, url] of [[false, "https://synthetic.invalid/a.png"], [true, "javascript:alert(1)"], [true, "data:text/html,example"]] as const) {
      const req = { ...request(), includeImages, forceRefresh: true }; const guide = generated(req);
      guide.activities[0].illustration.url = url;
      vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide }));
      expect((await createPrintableGuide(req)).activities[0].illustration.url).toBeUndefined();
    }
  });

  it("copies cached output so consumers cannot corrupt later reads", () => {
    const req = request(); cachePrintableGuide(req, generated(req));
    const result = getCachedPrintableGuide(req)!;
    result.activities[0].illustration.url = "javascript:alert(1)";
    result.activities[0].sayThis.push("Consumer edit");
    expect(getCachedPrintableGuide(req)?.activities[0].illustration.url).toBeUndefined();
    expect(getCachedPrintableGuide(req)?.activities[0].sayThis).not.toContain("Consumer edit");
  });

  it("does not read or write localStorage or sessionStorage", async () => {
    const blocked = { getItem: vi.fn(() => { throw Error("forbidden"); }), setItem: vi.fn(() => { throw Error("forbidden"); }) };
    vi.stubGlobal("localStorage", blocked); vi.stubGlobal("sessionStorage", blocked);
    const req = request(); vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide: generated(req) }));
    await createPrintableGuide(req);
    expect(getCachedPrintableGuide(req)?.provider).toBe("synthetic-provider");
    expect(blocked.getItem).not.toHaveBeenCalled(); expect(blocked.setItem).not.toHaveBeenCalled();
  });

  it("does not cache requests without an explicit local scope", async () => {
    const req = request(); cacheGuide(req, generated(req));
    expect(getCachedGuide(req)).toBeNull();
    vi.mocked(fetch).mockResolvedValue(reply({ success: true, guide: generated(req) }));
    await createGuide(req);
    expect(getCachedGuide(req)).toBeNull(); expect(storage.size).toBe(0);
  });

  it("expires after five minutes without extending retention on reads", () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000_000);
    const req = request(); cachePrintableGuide(req, generated(req));
    vi.advanceTimersByTime(299_999); expect(getCachedPrintableGuide(req)?.provider).toBe("synthetic-provider");
    vi.advanceTimersByTime(1); expect(getCachedPrintableGuide(req)).toBeNull();
  });

  it("checks the expiry deadline even if the timer has not run", () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000_000);
    const req = request(); cachePrintableGuide(req, generated(req));
    vi.setSystemTime(1_300_000); expect(getCachedPrintableGuide(req)).toBeNull();
  });

  it("retains at most one request in each scope", () => {
    const first = request(), second = { ...request(), mood: "focus" };
    cachePrintableGuide(first, generated(first)); cachePrintableGuide(second, generated(second));
    expect(getCachedPrintableGuide(first)).toBeNull();
    expect(getCachedPrintableGuide(second)?.provider).toBe("synthetic-provider");
  });

  it("prevents older success from overwriting newer cached enrichment", async () => {
    const req = { ...request(), forceRefresh: true }; const releases: Array<(response: Response) => void> = [];
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(resolve => releases.push(resolve)));
    const older = createPrintableGuide(req), newer = createPrintableGuide(req);
    const guide = generated(req); guide.activities[0].whyThisMatters = "Newer enrichment.";
    releases[1](reply({ success: true, guide })); await newer;
    releases[0](reply({ success: true, guide: generated(req) })); await older;
    expect(getCachedPrintableGuide(req)?.activities[0].whyThisMatters).toBe("Newer enrichment.");
  });

  it("prevents older failure from overwriting newer success", async () => {
    const req = { ...request(), forceRefresh: true }; const pending: Array<{ resolve: (response: Response) => void; reject: (reason: Error) => void }> = [];
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>((resolve, reject) => pending.push({ resolve, reject })));
    const older = createPrintableGuide(req), newer = createPrintableGuide(req);
    pending[1].resolve(reply({ success: true, guide: generated(req) })); await newer;
    pending[0].reject(Error("offline")); await older;
    expect(getCachedPrintableGuide(req)?.provider).toBe("synthetic-provider");
  });

  it("prevents older success from replacing newer fallback", async () => {
    const req = { ...request(), forceRefresh: true }; const releases: Array<(response: Response) => void> = [];
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(resolve => releases.push(resolve)));
    const older = createPrintableGuide(req), newer = createPrintableGuide(req);
    releases[1](reply({}, 503)); await newer;
    releases[0](reply({ success: true, guide: generated(req) })); await older;
    expect(getCachedPrintableGuide(req)?.provider).toBe("fallback");
  });

  it("prevents older identities from replacing a newer request in the same scope", async () => {
    const first = request(), second = { ...request(), mood: "focus" }; const releases: Array<(response: Response) => void> = [];
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(resolve => releases.push(resolve)));
    const older = createPrintableGuide(first), newer = createPrintableGuide(second);
    releases[1](reply({ success: true, guide: generated(second) })); await newer;
    releases[0](reply({ success: true, guide: generated(first) })); await older;
    expect(getCachedPrintableGuide(first)).toBeNull(); expect(getCachedPrintableGuide(second)?.provider).toBe("synthetic-provider");
  });

  it("scope cleanup clears cached context and prevents pending refill", async () => {
    const req = request(); cachePrintableGuide(req, generated(req)); let release!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(resolve => { release = resolve; }));
    const pending = createPrintableGuide({ ...req, forceRefresh: true });
    clearPrintableGuideCache(scope); expect(getCachedPrintableGuide(req)).toBeNull();
    release(reply({ success: true, guide: generated(req) })); await pending;
    expect(getCachedPrintableGuide(req)).toBeNull();
  });
});
