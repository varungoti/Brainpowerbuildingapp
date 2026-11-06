// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Activity } from "../../app/data/activities";
import type { PrintableGuide, PrintableGuideRequest } from "./guideTypes";
import { buildPrintableGuideFallback } from "./guideFallback";
import * as client from "./guideClient";
import { usePrintableGuide } from "./usePrintableGuide";
vi.mock("../../utils/supabase/info", () => ({ functionsBaseUrl: "https://synthetic.invalid/make-server-76b0ba9a" }));
function request(): PrintableGuideRequest {
  return { childName: "Synthetic Child", childAge: 3, ageTier: 3, mood: "focus", includeImages: true, activities: [{
    id: "synthetic-paper", name: "Synthetic paper play", emoji: "□", regionEmoji: "□", region: "Synthetic",
    description: "Arrange paper.", instructions: ["Place paper on a clear surface."], duration: 10,
    materials: ["Paper"], intelligences: ["Spatial-Visual"], method: "Synthetic", ageTiers: [3], difficulty: 1,
    parentTip: "Play together.", contraindications: ["Keep the space clear."],
  } as Activity] };
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup() {
  const props = { request: request() as PrintableGuideRequest | null, scope: client.createPrintableGuideCacheScope(), enabled: true };
  return { props, ...renderHook(p => usePrintableGuide(p.request, p.scope, p.enabled), {
    initialProps: props, wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
  }) };
}
function start(result: ReturnType<typeof setup>["result"], options?: { forceRefresh?: boolean }) {
  let task!: Promise<void>; act(() => { task = result.current.createGuide(options); }); return task;
}
const requests: Array<{ body: PrintableGuideRequest; pending: ReturnType<typeof deferred<Response>> }> = [];
beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal("fetch", vi.fn((url: string, init: RequestInit) => {
    expect(url).toBe("https://synthetic.invalid/printable/guide"); expect(init.method).toBe("POST");
    const pending = deferred<Response>(); requests.push({ body: JSON.parse(init.body as string), pending }); return pending.promise;
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function finish(index: number, label: string, task: Promise<void>, fail = false) {
  await act(async () => {
    const req = requests[index];
    if (fail) req.pending.reject(new Error("Synthetic offline"));
    else req.pending.resolve(new Response(JSON.stringify({ success: true, guide: { ...buildPrintableGuideFallback(req.body), provider: "synthetic-provider", model: label } }), { status: 200 }));
    await task;
  });
}
function empty(value: ReturnType<typeof usePrintableGuide>) {
  expect(value.guide).toBeNull(); expect(value.status).toBeNull(); expect(value.loading).toBe(false);
}
it("publishes current success and reuses scoped cache without fetching", async () => {
  const { result } = setup(); await finish(0, "CURRENT", start(result));
  expect(result.current.guide?.model).toBe("CURRENT"); expect(result.current.status).toBe("Guide ready."); expect(result.current.loading).toBe(false);
  await act(async () => { await result.current.createGuide(); }); expect(requests).toHaveLength(1); expect(result.current.guide?.model).toBe("CURRENT");
});
it("current fetch failure uses offline fallback and clears loading", async () => {
  const { result } = setup(); await finish(0, "unused", start(result), true);
  expect(result.current.guide?.provider).toBe("fallback"); expect(result.current.status).toBe("Using simple offline guide."); expect(result.current.loading).toBe(false);
});
it("unexpected rejected client uses captured local fallback", async () => {
  vi.spyOn(client, "createPrintableGuide").mockRejectedValueOnce(new Error("Synthetic rejection")); const { result } = setup();
  await act(async () => { await result.current.createGuide(); }); expect(result.current.guide?.provider).toBe("fallback"); expect(result.current.loading).toBe(false); expect(requests).toHaveLength(0);
});
for (const oldFails of [false, true]) for (const oldFirst of [false, true]) it(`last-started wins: old failure=${oldFails}, old completes first=${oldFirst}`, async () => {
  const { result, props } = setup(); const older = start(result, { forceRefresh: true }), newer = start(result, { forceRefresh: true });
  if (oldFirst) {
    await finish(0, "OLD", older, oldFails); expect(result.current.loading).toBe(true); expect(result.current.status).toMatch(/^Creating/); expect(result.current.guide).toBeNull(); await finish(1, "NEW", newer);
  } else { await finish(1, "NEW", newer); await finish(0, "OLD", older, oldFails); }
  expect(result.current.guide?.model).toBe("NEW"); expect(result.current.status).toBe("Guide ready."); expect(result.current.loading).toBe(false);
  expect(client.getCachedPrintableGuide(props.request!, props.scope)?.model).toBe("NEW");
});
for (const change of ["account", "child", "name", "age", "mood", "instructions", "warnings", "close", "empty", "missing"] as const) it(`clears old display and rejects pending completion after ${change}`, async () => {
  const { result, rerender, props } = setup(); await finish(0, "DISPLAYED", start(result)); const task = start(result, { forceRefresh: true });
  const next = { ...props, request: structuredClone(props.request) };
  if (change === "account" || change === "child") next.scope = client.createPrintableGuideCacheScope();
  if (change === "name") next.request!.childName = "Synthetic Other";
  if (change === "age") next.request!.childAge = 4;
  if (change === "mood") next.request!.mood = "calm";
  if (change === "instructions") next.request!.activities[0].instructions = ["Changed synthetic step."];
  if (change === "warnings") next.request!.activities[0].contraindications = ["Changed synthetic warning."];
  if (change === "close") next.enabled = false;
  if (change === "empty") next.request!.activities = [];
  if (change === "missing") next.request = null;
  rerender(next); empty(result.current); await finish(1, "LATE", task); empty(result.current);
  expect(client.getCachedPrintableGuide(props.request!, props.scope)).toBeNull();
});
it("clears a displayed guide on context change without replacement work", async () => {
  const { result, rerender, props } = setup(); await finish(0, "DISPLAYED", start(result));
  rerender({ ...props, scope: client.createPrintableGuideCacheScope() }); empty(result.current); expect(requests).toHaveLength(1);
});
it("close/reopen never revives earlier work with identical input", async () => {
  const { result, rerender, props } = setup(); const older = start(result); rerender({ ...props, enabled: false }); rerender(props);
  const newer = start(result); await finish(0, "OLD", older); expect(result.current.loading).toBe(true); await finish(1, "NEW", newer); expect(result.current.guide?.model).toBe("NEW");
});
it("ABA owner change cannot revive the first A operation", async () => {
  const { result, rerender, props } = setup(); const older = start(result);
  rerender({ ...props, scope: client.createPrintableGuideCacheScope() }); rerender(props); await finish(0, "OLD A", older); empty(result.current);
});
for (const reject of [false, true]) it(`icons supersede pending ${reject ? "failure" : "success"} and cache writes`, async () => {
  const { result, props } = setup(); const task = start(result); act(() => result.current.useIconGuide()); const icons = result.current.guide;
  expect(icons?.provider).toBe("fallback"); expect(result.current.loading).toBe(false); expect(result.current.status).toBe("Simple icon version ready.");
  await finish(0, "LATE", task, reject); expect(result.current.guide).toBe(icons); expect(result.current.status).toBe("Simple icon version ready.");
  expect(client.getCachedPrintableGuide(props.request!, props.scope)).toBeNull(); expect(requests).toHaveLength(1);
});
it("standalone icons perform no provider request", () => {
  const { result } = setup(); act(() => result.current.useIconGuide()); expect(result.current.guide?.provider).toBe("fallback");
  expect(result.current.guide?.activities.every(a => !a.illustration.url)).toBe(true); expect(requests).toHaveLength(0);
});
it("stale client rejection cannot clear newer loading or show fallback", async () => {
  const old = deferred<PrintableGuide>(); vi.spyOn(client, "createPrintableGuide").mockImplementationOnce(() => old.promise);
  const { result, rerender, props } = setup(); const oldTask = start(result); rerender({ ...props, scope: client.createPrintableGuideCacheScope() }); const newer = start(result);
  await act(async () => { old.reject(new Error("Synthetic old failure")); await oldTask; });
  expect(result.current.loading).toBe(true); expect(result.current.guide).toBeNull(); expect(result.current.status).toMatch(/^Creating/);
  await finish(0, "NEW", newer); expect(result.current.guide?.model).toBe("NEW");
});
for (const reject of [false, true]) it(`unmount invalidates ${reject ? "failure" : "success"}; remount is independent`, async () => {
  const first = setup(); const older = start(first.result); first.unmount(); const second = setup(); const newer = start(second.result);
  await finish(0, "OLD", older, reject); expect(second.result.current.loading).toBe(true); expect(client.getCachedPrintableGuide(first.props.request!, first.props.scope)).toBeNull();
  await finish(1, "NEW", newer); expect(second.result.current.guide?.model).toBe("NEW");
});
it("same-value rerenders preserve pending work and send no scope/token fields", async () => {
  const { result, rerender, props } = setup(); const task = start(result); rerender({ ...props, request: structuredClone(props.request) });
  expect(result.current.loading).toBe(true); await finish(0, "SAME", task); expect(result.current.guide?.model).toBe("SAME");
  expect(Object.keys(requests[0].body).sort()).toEqual(["activities", "ageTier", "childAge", "childName", "includeImages", "mood"]);
});
it("captured stale handlers cannot initiate provider requests", () => {
  const { result, rerender, props } = setup(); const stale = result.current; rerender({ ...props, scope: client.createPrintableGuideCacheScope() });
  act(() => { void stale.createGuide(); stale.useIconGuide(); }); expect(requests).toHaveLength(0); empty(result.current);
});
it("in-flight snapshots resist later input mutation", async () => {
  const { result, props } = setup(); const task = start(result); props.request!.activities[0].instructions[0] = "MUTATED";
  expect(requests[0].body.activities[0].instructions).toEqual(["Place paper on a clear surface."]);
  await finish(0, "ORIGINAL", task); empty(result.current);
});
it("disabled, empty and missing requests cannot initiate work", async () => {
  const { result, rerender, props } = setup();
  for (const next of [{ ...props, enabled: false }, { ...props, request: null }, { ...props, request: { ...request(), activities: [] } }]) {
    rerender(next); await act(async () => { await result.current.createGuide(); result.current.useIconGuide(); }); empty(result.current);
  } expect(requests).toHaveLength(0);
});
it("never exposes old guide/status/loading during the first changed render", async () => {
  const props = { request: request(), scope: client.createPrintableGuideCacheScope(), enabled: true };
  const renders: Array<Pick<ReturnType<typeof usePrintableGuide>, "guide" | "status" | "loading">> = [];
  const view = renderHook(p => {
    const value = usePrintableGuide(p.request, p.scope, p.enabled);
    renders.push({ guide: value.guide, status: value.status, loading: value.loading });
    return value;
  }, { initialProps: props, wrapper: ({ children }) => <StrictMode>{children}</StrictMode> });
  await finish(0, "OLD", start(view.result));
  renders.length = 0;
  view.rerender({ ...props, scope: client.createPrintableGuideCacheScope() });
  expect(renders.length).toBeGreaterThan(0);
  for (const visible of renders) expect(visible).toEqual({ guide: null, status: null, loading: false });
});
for (const oldFirst of [false, true]) it(`latest failure keeps its fallback over older success: old first=${oldFirst}`, async () => {
  const { result } = setup();
  const older = start(result, { forceRefresh: true }), newer = start(result, { forceRefresh: true });
  if (oldFirst) {
    await finish(0, "OLD", older);
    expect(result.current.loading).toBe(true);
    await finish(1, "unused", newer, true);
  } else {
    await finish(1, "unused", newer, true);
    await finish(0, "OLD", older);
  }
  expect(result.current.guide?.provider).toBe("fallback");
  expect(result.current.status).toBe("Using simple offline guide.");
  expect(result.current.loading).toBe(false);
});
it("queued old status/loading cannot replace a newer request begun before React commits", async () => {
  const { result } = setup();
  const older = start(result);
  let newer!: Promise<void>;
  await act(async () => {
    pendingSuccess(0, "OLD");
    await older;
    newer = result.current.createGuide({ forceRefresh: true });
  });
  // A completed matching guide may remain visible during regeneration.
  expect(result.current.loading).toBe(true);
  expect(result.current.status).toMatch(/^Creating/);
  await finish(1, "NEW", newer);
  expect(result.current.guide?.model).toBe("NEW");
});
function pendingSuccess(index: number, model: string) {
  const req = requests[index];
  req.pending.resolve(new Response(JSON.stringify({ success: true, guide: { ...buildPrintableGuideFallback(req.body), provider: "synthetic-provider", model } }), { status: 200 }));
}
