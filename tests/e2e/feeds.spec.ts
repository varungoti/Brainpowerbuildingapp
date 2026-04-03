import { expect, test } from "@playwright/test";

const LS_APP = "neurospark_v2";
const LS_FEED = "neurospark_feed_posts_v1";

type FeedPostSeed = {
  id: string;
  communityId: string;
  channel: string;
  title: string;
  body: string;
  authorUserId: string;
  authorEmail: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

const parentPersisted = {
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
      intelligenceScores: {} as Record<string, number>,
    },
  ],
  activeChildId: "child-1",
  activityLogs: [] as unknown[],
  materialInventory: ["paper", "pencils"],
  credits: 3,
  lastPackGeneratedOn: null,
  kycData: {},
  outcomeChecklists: {},
  milestoneChecks: {},
};

async function seedAppAndFeeds(page: import("@playwright/test").Page, posts: FeedPostSeed[]) {
  await page.addInitScript(
    ({ appKey, feedKey, app, posts: feedPosts }) => {
      window.localStorage.setItem(appKey, JSON.stringify(app));
      window.localStorage.setItem(feedKey, JSON.stringify({ version: 1, posts: feedPosts }));
    },
    { appKey: LS_APP, feedKey: LS_FEED, app: parentPersisted, posts },
  );
}

test.describe("Community feeds", () => {
  test("create, edit, and delete own post (local storage)", async ({ page }) => {
    await seedAppAndFeeds(page, []);
    await page.goto("/");

    await page.getByRole("button", { name: /Community feeds/i }).click();
    await expect(page.getByTestId("feeds-root")).toBeVisible();

    await page.getByTestId("feeds-tab-ai_news").click();
    await page.getByTestId("feeds-new-post").click();
    await expect(page.getByTestId("feeds-modal-compose")).toBeVisible();

    await page.getByTestId("feeds-form-channel").selectOption("ai_news");
    await page.getByTestId("feeds-form-title").fill("E2E feed title");
    await page.getByTestId("feeds-form-body").fill("E2E feed body line");
    await page.getByTestId("feeds-compose-submit").click();

    await expect(page.getByTestId("feeds-modal-compose")).not.toBeVisible();
    await expect(page.getByText("E2E feed title")).toBeVisible();
    await expect(page.getByText("E2E feed body line")).toBeVisible();

    const card = page.getByTestId("feeds-post-card").filter({ hasText: "E2E feed title" });
    await card.getByTestId("feeds-edit").click();
    await expect(page.getByTestId("feeds-modal-edit")).toBeVisible();
    await page.getByTestId("feeds-form-title").fill("E2E feed title edited");
    await page.getByTestId("feeds-edit-submit").click();
    await expect(page.getByTestId("feeds-modal-edit")).not.toBeVisible();
    await expect(page.getByText("E2E feed title edited")).toBeVisible();

    await page
      .getByTestId("feeds-post-card")
      .filter({ hasText: "E2E feed title edited" })
      .getByTestId("feeds-delete")
      .click();
    await page.getByTestId("feeds-delete-confirm").click();
    await expect(page.getByText("E2E feed title edited")).not.toBeVisible();
  });

  test("no edit/delete on another user's post", async ({ page }) => {
    const otherPost: FeedPostSeed = {
      id: "post-by-stranger",
      communityId: "default",
      channel: "general",
      title: "Stranger post",
      body: "You cannot edit this from E2E parent session.",
      authorUserId: "someone-else-id",
      authorEmail: "stranger@example.com",
      authorDisplayName: "Stranger",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    await seedAppAndFeeds(page, [otherPost]);
    await page.goto("/");

    await page.getByRole("button", { name: /Community feeds/i }).click();
    await expect(page.getByTestId("feeds-root")).toBeVisible();
    await expect(page.getByText("Stranger post")).toBeVisible();

    const card = page.getByTestId("feeds-post-card").filter({ hasText: "Stranger post" });
    await expect(card.getByTestId("feeds-edit")).toHaveCount(0);
    await expect(card.getByTestId("feeds-delete")).toHaveCount(0);
  });
});
