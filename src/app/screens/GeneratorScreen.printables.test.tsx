// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PrintableGuide, PrintableGuideRequest } from "../../lib/printables/guideTypes";
import { buildPrintableGuideFallback } from "../../lib/printables/guideFallback";
import * as client from "../../lib/printables/guideClient";
import { GeneratorScreen } from "./GeneratorScreen";
const h = vi.hoisted(() => ({ app: {} as any, nextPack: [] as any[] }));
vi.mock("../context/AppContext", () => ({ useApp: () => h.app }));
vi.mock("../data/activities", () => ({
  MATERIAL_OPTIONS: [], MOOD_OPTIONS: [{ id: "focus", label: "Focus" }, { id: "calm", label: "Calm" }], INTEL_COLORS: {}, SKILL_TAG_UI: {},
  runAGE: () => h.nextPack, getAgeTierConfig: () => ({ label: "Synthetic", desc: "Synthetic" }), buildLastCompletionMap: () => ({}),
}));
vi.mock("../data/activityWhy", () => ({ buildWhyPickedLines: () => [] }));
vi.mock("../data/outcomeChecklist", () => ({ getOutcomeFocusPillars: () => [] }));
vi.mock("@/lib/competencies/aiAgeCompetencies", () => ({ pickPriorityCompetencies: () => [] }));
vi.mock("@/utils/productAnalytics", () => ({ captureProductEvent: () => {} }));
vi.mock("@/components/competency/CompetencyBadges", () => ({ CompetencyBadges: () => null }));
vi.mock("@/components/printables/PrintableGuidePreview", () => ({ PrintableGuidePreview: ({ guide }: { guide: PrintableGuide }) =>
  <div data-testid="guide">{guide.childName}|{guide.model ?? guide.provider}|{guide.activities[0]?.steps.join(";")}</div> }));
vi.mock("@/utils/remoteAppConfig", () => ({ fetchRemoteAppFlags: async () => ({}) }));
vi.mock("../../utils/supabase/info", () => ({ functionsBaseUrl: "https://synthetic.invalid/make-server-76b0ba9a" }));
const pending: Array<{ body: PrintableGuideRequest; resolve: (response: Response) => void; reject: (error: Error) => void }> = [];
function activity() { return {
  id: "synthetic", name: "Synthetic Paper", description: "Paper play.", emoji: "□", regionEmoji: "□", region: "Synthetic",
  duration: 10, materials: ["Paper"], intelligences: ["Synthetic"], method: "Synthetic", parentTip: "Play together.",
  instructions: ["ORIGINAL STEP"], contraindications: ["Supervise closely."],
}; }
beforeEach(() => {
  pending.length = 0; localStorage.clear();
  h.app = {
    user: { id: "synthetic-owner-a", supabaseUid: "synthetic-uid-a" }, activeChild: { id: "synthetic-child-a", name: "Synthetic Child", ageTier: 3 },
    materialInventory: ["paper"], activityLogs: [], kycData: {}, outcomeChecklists: {}, generatedPack: [activity()], lastPackGeneratedOn: new Date().toDateString(),
    setGeneratedPack: vi.fn(), logActivity: vi.fn(), setViewingActivity: vi.fn(), navigate: vi.fn(), consumeCredit: () => true, hasCreditForToday: () => true,
    generatorIntent: null, clearGeneratorIntent: vi.fn(), setMaterialInventory: vi.fn(),
  };
  h.nextPack = [{ ...activity(), id: "synthetic-new", instructions: ["NEW STEP"] }];
  vi.stubGlobal("fetch", vi.fn((url: string, init: RequestInit) => {
    expect(url).toBe("https://synthetic.invalid/printable/guide"); expect(init.method).toBe("POST");
    return new Promise<Response>((resolve, reject) => pending.push({ body: JSON.parse(init.body as string), resolve, reject }));
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function mount() {
  const view = render(<StrictMode><GeneratorScreen /></StrictMode>);
  await act(async () => {});
  return { ...view, refresh: () => view.rerender(<StrictMode><GeneratorScreen /></StrictMode>) };
}
function click(name: string | RegExp) { fireEvent.click(screen.getByRole("button", { name })); }
async function settle(index: number, model = "REMOTE", fail = false) {
  await act(async () => {
    const req = pending[index];
    if (fail) req.reject(new Error("Synthetic offline"));
    else req.resolve(new Response(JSON.stringify({ success: true, guide: { ...buildPrintableGuideFallback(req.body), provider: "synthetic-provider", model } }), { status: 200 }));
  });
}
async function newPack() {
  click(/Generate New Pack/); click(/Generate My Pack/); await act(async () => vi.advanceTimersByTime(2200));
}
it("renders the current successful guide and actions", async () => {
  await mount(); click("Create guide"); await settle(0, "CURRENT");
  expect(screen.getByTestId("guide").textContent).toContain("CURRENT");
  expect(screen.getByText("Guide ready.")).toBeTruthy(); expect(screen.getByRole("button", { name: "Print" })).toBeTruthy();
});
for (const change of ["owner-id", "owner-uid", "child-id", "child-name", "child-age", "logout"] as const) it(`clears displayed guide/status on ${change}, with identical other data`, async () => {
  const view = await mount(); click("Create guide"); await settle(0, "OLD");
  if (change === "owner-id") h.app.user = { ...h.app.user, id: "synthetic-owner-b" };
  if (change === "owner-uid") h.app.user = { ...h.app.user, supabaseUid: "synthetic-uid-b" };
  if (change === "child-id") h.app.activeChild = { ...h.app.activeChild, id: "synthetic-child-b" };
  if (change === "child-name") h.app.activeChild = { ...h.app.activeChild, name: "Synthetic Other" };
  if (change === "child-age") h.app.activeChild = { ...h.app.activeChild, ageTier: 4 };
  if (change === "logout") h.app.user = null;
  view.refresh(); expect(screen.queryByTestId("guide")).toBeNull(); expect(screen.queryByText("Guide ready.")).toBeNull();
  expect(pending).toHaveLength(1);
});
for (const failure of [false, true]) it(`ignores old account's late ${failure ? "failure" : "success"}`, async () => {
  const view = await mount(); click("Create guide"); h.app.user = { id: "synthetic-owner-b", supabaseUid: "synthetic-uid-b" }; view.refresh();
  await settle(0, "OLD", failure); expect(screen.queryByTestId("guide")).toBeNull();
  expect(screen.queryByText("Guide ready.")).toBeNull(); expect(screen.queryByText("Using simple offline guide.")).toBeNull();
  expect((screen.getByRole("button", { name: "Create guide" }) as HTMLButtonElement).disabled).toBe(false);
});
it("pending icon choice is enabled and survives the late remote response", async () => {
  await mount(); click("Create guide"); expect((screen.getByRole("button", { name: "Icons only" }) as HTMLButtonElement).disabled).toBe(false);
  click("Icons only"); expect(screen.getByTestId("guide").textContent).toContain("deterministic"); await settle(0, "OLD");
  expect(screen.getByTestId("guide").textContent).toContain("deterministic"); expect(screen.getByText("Simple icon version ready.")).toBeTruthy(); expect(pending).toHaveLength(1);
});
it("standalone icon choice never requests a provider", async () => {
  await mount(); click("Icons only"); expect(screen.getByTestId("guide").textContent).toContain("deterministic"); expect(pending).toHaveLength(0);
});
for (const failure of [false, true]) it(`new pack rejects old ${failure ? "failed" : "successful"} guide`, async () => {
  vi.useFakeTimers(); await mount(); click("Create guide"); await newPack(); await settle(0, "OLD", failure);
  expect(screen.queryByTestId("guide")).toBeNull(); expect(screen.queryByText("Using simple offline guide.")).toBeNull();
  click("Create guide"); await settle(1, "NEW"); expect(screen.getByTestId("guide").textContent).toContain("NEW STEP");
});
it("old completion cannot clear a new pack request's loading", async () => {
  vi.useFakeTimers(); await mount(); click("Create guide"); await newPack(); click("Create guide");
  expect(pending).toHaveLength(2); await settle(0, "OLD"); expect(screen.getByRole("button", { name: "Creating..." })).toBeTruthy();
  expect(screen.queryByTestId("guide")).toBeNull(); await settle(1, "NEW"); expect(screen.getByTestId("guide").textContent).toContain("NEW");
});
it("old client rejection after account change cannot publish a catch fallback", async () => {
  let reject!: (error: Error) => void; vi.spyOn(client, "createPrintableGuide").mockImplementationOnce(() => new Promise((_ok, no) => { reject = no; }));
  const view = await mount(); click("Create guide"); h.app.user = { id: "synthetic-owner-b" }; view.refresh();
  await act(async () => reject(new Error("Synthetic client failure"))); expect(screen.queryByTestId("guide")).toBeNull(); expect(screen.queryByText("Using simple offline guide.")).toBeNull();
});
it("unmount and remount isolate a pending old guide", async () => {
  const first = await mount(); click("Create guide"); first.unmount(); await mount(); click("Create guide");
  await settle(0, "OLD"); expect(screen.queryByTestId("guide")).toBeNull(); expect(screen.getByRole("button", { name: "Creating..." })).toBeTruthy();
  await settle(1, "NEW"); expect(screen.getByTestId("guide").textContent).toContain("NEW");
});

it("regeneration preserves its matching guide and action-bar icons supersede it", async () => {
  await mount(); click("Create guide"); await settle(0, "CURRENT");
  click("Regenerate illustrations");
  expect(screen.getByTestId("guide").textContent).toContain("CURRENT");
  expect((screen.getByRole("button", { name: "Use simple icon version" }) as HTMLButtonElement).disabled).toBe(false);
  click("Use simple icon version");
  await settle(1, "LATE");
  expect(screen.getByTestId("guide").textContent).toContain("deterministic");
  expect(screen.getByText("Simple icon version ready.")).toBeTruthy();
});
