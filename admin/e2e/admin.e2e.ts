import { expect, test, type Page } from "@playwright/test";

async function mockAdminApi(page: Page) {
  await page.route("**/admin/metrics/dau", (route) =>
    route.fulfill({ json: { data: [{ day: "2026-05-01", dau: 42 }] } }),
  );
  await page.route("**/admin/families?limit=1", (route) =>
    route.fulfill({ json: { count: 2, data: [] } }),
  );
  await page.route("**/admin/subscriptions?status=active", (route) =>
    route.fulfill({ json: { count: 1, data: [] } }),
  );
  await page.route("**/admin/costs", (route) =>
    route.fulfill({ json: { data: [{ service: "ai:coach", provider: "fireworks", sum: "3.25" }] } }),
  );
  await page.route("**/admin/audit?limit=200", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            created_at: "2026-05-01T10:00:00Z",
            actor_email: "ops@example.com",
            action: "comp_premium",
            target_type: "user",
            target_id: "user-1",
            payload: { months: 1 },
          },
        ],
      },
    }),
  );
  await page.route("**/admin/families?limit=100**", (route) =>
    route.fulfill({
      json: {
        count: 1,
        data: [
          {
            user_id: "user-1",
            email: "parent@example.com",
            display_name: "Priya Parent",
            created_at: "2026-05-01",
          },
        ],
      },
    }),
  );
  await page.route("**/admin/families/user-1", (route) =>
    route.fulfill({
      json: {
        profile: {
          user_id: "user-1",
          email: "parent@example.com",
          display_name: "Priya Parent",
          created_at: "2026-05-01",
        },
        children: [{ name: "Maya", age: 4, created_at: "2026-05-01" }],
        sessions: [{ created_at: "2026-05-01T12:00:00Z", device: "web", duration_seconds: 480 }],
        subscription: { status: "active" },
      },
    }),
  );
  await page.route("**/admin/missions", (route) =>
    route.fulfill({
      json: {
        missions: [
          {
            key: "prod_verify_green",
            trackId: "launch_prod",
            trackLabel: "Launch & production",
            title: "Green verify gate",
            description: "Run verify in CI.",
            xp: 25,
            tier: "standard",
            sortOrder: 1,
            completed: false,
            completed_at: null,
            xp_awarded: null,
          },
        ],
        stats: {
          totalXp: 0,
          level: 1,
          xpIntoLevel: 0,
          xpForNextLevel: 400,
          streak: 0,
          completedCount: 0,
          totalMissions: 54,
          percent: 0,
          badges: [
            { id: "first_step", title: "First step", description: "Complete any mission.", emoji: "👣", unlocked: false },
          ],
          byTrack: { launch_prod: { label: "Launch & production", done: 0, total: 1 } },
        },
      },
    }),
  );
}

test("admin login sends a magic link", async ({ page }) => {
  await page.route("**/auth/v1/otp*", (route) => route.fulfill({ json: {} }));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "NeuroSpark Admin" })).toBeVisible();
  await page.getByPlaceholder("you@neurospark.com").fill("ops@example.com");
  await page.getByRole("button", { name: "Send magic link" }).click();

  await expect(page.getByRole("button", { name: "Check your inbox" })).toBeVisible();
});

test("authenticated admin can view audit log and drill into a family", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("neurospark.admin.e2e.session", "1");
  });
  await mockAdminApi(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("42")).toBeVisible();

  await page.getByRole("link", { name: /Audit log/ }).click();
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await expect(page.getByText("comp_premium")).toBeVisible();

  await page.getByRole("link", { name: /Families/ }).click();
  await expect(page.getByRole("heading", { name: "Families" })).toBeVisible();
  await expect(page.getByText("parent@example.com")).toBeVisible();

  await page.getByRole("link", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: "Family detail" })).toBeVisible();
  await expect(page.getByText("Maya")).toBeVisible();
  await expect(page.getByText("active")).toBeVisible();
});

test("authenticated admin can open Mission HQ", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("neurospark.admin.e2e.session", "1");
  });
  await mockAdminApi(page);

  await page.goto("/#/missions");
  await expect(page.getByText("Mission HQ", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ops quests/ })).toBeVisible();
  await expect(page.getByText("Operator level")).toBeVisible();
  await expect(page.getByText("Green verify gate")).toBeVisible();
});
