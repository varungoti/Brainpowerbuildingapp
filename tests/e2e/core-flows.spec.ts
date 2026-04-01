import { expect, test } from "@playwright/test";

type SeedState = {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    dob: string;
    ageTier: number;
    avatarEmoji: string;
    avatarColor: string;
    brainPoints: number;
    level: number;
    streak: number;
    lastStreakDate: string;
    badges: string[];
    totalActivities: number;
    intelligenceScores: Record<string, number>;
  }>;
  activeChildId: string | null;
  activityLogs: Array<unknown>;
  materialInventory: string[];
  credits: number;
  lastPackGeneratedOn: string | null;
  kycData: Record<string, unknown>;
  outcomeChecklists: Record<string, unknown>;
  milestoneChecks: Record<string, string[]>;
};

const seededState: SeedState = {
  user: {
    id: "local-parent",
    email: "parent@example.com",
    name: "Parent",
    createdAt: "2026-03-19T00:00:00.000Z",
  },
  children: [
    {
      id: "child-1",
      name: "Aarav",
      dob: "2021-04-15",
      ageTier: 2,
      avatarEmoji: "🦁",
      avatarColor: "#4361EE",
      brainPoints: 0,
      level: 0,
      streak: 0,
      lastStreakDate: "",
      badges: [],
      totalActivities: 0,
      intelligenceScores: {},
    },
  ],
  activeChildId: "child-1",
  activityLogs: [],
  materialInventory: ["paper", "pencils", "cups", "water", "blanket", "spoons", "outdoor"],
  credits: 3,
  lastPackGeneratedOn: null,
  kycData: {},
  outcomeChecklists: {},
  milestoneChecks: {},
};

async function seedLocalState(page: import("@playwright/test").Page, state = seededState) {
  await page.addInitScript((persisted) => {
    window.localStorage.setItem("neurospark_v2", JSON.stringify(persisted));
  }, state);
}

test.describe("NeuroSpark core flows", () => {
  test("mock signup onboarding reaches the home experience", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Get Started Free/i }).click();
    await page.getByPlaceholder(/Priya Sharma/i).fill("Priya");
    await page.getByPlaceholder(/parent@email.com/i).fill("priya@example.com");
    await page.getByPlaceholder(/Minimum 6 characters/i).fill("secret1");
    await page.getByRole("button", { name: /Create Account & Start/i }).click();

    await expect(page.getByText(/Welcome, Priya!/i)).toBeVisible();
    await page.getByRole("button", { name: /Set Up My Child/i }).click();
    await page.getByPlaceholder(/Arjun, Aisha, Leo/i).fill("Aarav");
    await page.getByRole("button", { name: /Next: Materials/i }).click();
    await page.getByRole("button", { name: /Select All/i }).click();
    await page.getByRole("button", { name: /Next: All Ready/i }).click();
    await page.getByRole("button", { name: /Generate First Activities/i }).click();

    await expect(page.getByText(/2026 Year Plan/i)).toBeVisible();
    await expect(page.getByText(/NeuroSpark AI Counselor/i)).toBeVisible();
  });

  test("seeded user can generate a pack and open full activity detail", async ({ page }) => {
    await seedLocalState(page);
    await page.goto("/");

    await page.getByRole("button", { name: /^Today/i }).click();
    await page.getByRole("button", { name: /Generate My Pack/i }).click();

    await expect(page.getByText(/Today's Pack for/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/Tap to expand, or open the full detail view below/i).first().click();
    await page.getByRole("button", { name: /Open full detail/i }).first().click();

    await expect(page.getByText(/What this activity builds/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Back to activities/i })).toBeVisible();
  });

  test("seeded user can reach backup tools from profile", async ({ page }) => {
    await seedLocalState(page);
    await page.goto("/");

    await page.getByRole("button", { name: /^Profile/i }).click();
    await page.getByRole("button", { name: /Show backup tools/i }).click();

    await expect(page.getByRole("button", { name: /Download backup/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Choose backup to restore/i })).toBeVisible();
  });

  test("offline states stay understandable for AI help and paywall", async ({ page, context }) => {
    await seedLocalState(page, { ...seededState, credits: 0 });
    await page.goto("/");
    await context.setOffline(true);
    await expect(
      page.getByText(/Offline mode: local profiles, history, and backups still work/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /AI Help/i }).click();
    await expect(page.getByText(/Offline right now/i)).toBeVisible();
    await expect(
      page.getByText(/new AI research requests will wait until you reconnect/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Home$/i }).click();
    await page.getByRole("button", { name: /^Today$/i }).click();
    await expect(page.getByText(/^Offline mode$/i)).toBeVisible();
    await expect(
      page.getByText(/payment starts only after you reconnect/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay ₹/i })).toBeDisabled();

    await context.setOffline(false);
  });

  test("backup export file is downloadable and importable", async ({ page }) => {
    await seedLocalState(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Profile/i }).click();

    // Reveal backup tools
    await page.getByRole("button", { name: /Show backup tools/i }).click();
    await expect(page.getByRole("button", { name: /Download backup/i })).toBeVisible();

    // Trigger download and capture the file content via the download event
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Download backup/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/neurospark-backup-\d{4}-\d{2}-\d{2}\.json/);

    // Read the downloaded file and verify it is valid JSON with the expected shape
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.format).toBe("neurospark_backup");
    expect(parsed.version).toBe(1);
    expect(parsed.payload).toBeTruthy();

    // Simulate restore: write the backup into localStorage as the parse result
    const payload = parsed.payload as Record<string, unknown>;
    await page.evaluate((p) => {
      window.localStorage.setItem("neurospark_v2", JSON.stringify(p));
    }, payload);

    // Reload and confirm the child name is still present (appears in multiple elements — check first)
    await page.reload();
    await expect(page.getByText(/Aarav/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("milestone completion persists across navigation", async ({ page }) => {
    await seedLocalState(page);
    await page.goto("/");

    await page.getByRole("button", { name: /^Brain$/i }).click();
    await page.getByRole("button", { name: /Developmental Milestones Tracker/i }).click();
    await expect(page.getByText(/Brain Development Progress/i)).toBeVisible();

    const firstMilestoneToggle = page.locator('button[aria-label^="Mark "]').first();
    await firstMilestoneToggle.click();
    await expect(firstMilestoneToggle).toHaveAttribute("aria-label", /Mark .* incomplete/i);

    await page.getByRole("button", { name: /^Home$/i }).click();
    await page.getByRole("button", { name: /^Brain$/i }).click();
    await page.getByRole("button", { name: /Developmental Milestones Tracker/i }).click();
    await expect(page.getByRole("button", { name: /Mark .* incomplete/i }).first()).toBeVisible();
  });
});
