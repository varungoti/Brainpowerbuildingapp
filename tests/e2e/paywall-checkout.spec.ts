import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type SeedState = {
  user: { id: string; email: string; name: string; createdAt: string } | null;
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
  materialInventory: ["paper", "pencils"],
  credits: 0,
  lastPackGeneratedOn: null,
  kycData: {},
  outcomeChecklists: {},
  milestoneChecks: {},
};

async function seedLocalState(page: Page, state = seededState) {
  await page.addInitScript((persisted) => {
    window.localStorage.setItem("neurospark_v2", JSON.stringify(persisted));
  }, state);
}

async function installPaywallNetworkMocks(page: Page) {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        window.Razorpay = function (opts) {
          this.open = function () {
            queueMicrotask(function () {
              try {
                opts.handler({
                  razorpay_payment_id: "pay_e2e_mock",
                  razorpay_order_id: opts.order_id,
                  razorpay_signature: "sig_e2e_mock",
                });
              } catch (e) { console.error(e); }
            });
          };
        };
      `,
    });
  });

  await page.route("**/razorpay/create-order", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        orderId: "order_e2e_mock",
        amount: 200000,
        currency: "INR",
        keyId: "rzp_test_e2e",
      }),
    });
  });

  await page.route("**/razorpay/verify-payment", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, paymentId: "pay_e2e_mock" }),
    });
  });

  await page.route("**/remote-config", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        flags: { payments_remote_kill: false, ai_counselor_paused: false },
        updatedAt: new Date().toISOString(),
      }),
    });
  });
}

test.describe("Paywall checkout (mocked Razorpay + Edge)", () => {
  test("completes mocked Razorpay flow and grants credits", async ({ page }) => {
    await installPaywallNetworkMocks(page);
    await seedLocalState(page);
    await page.goto("/");

    await page.getByRole("button", { name: /^Today$/i }).click();
    await expect(page.getByText(/Unlock Today's Brain Pack/i)).toBeVisible();
    await expect(page.getByTestId("paywall-pay-button")).toBeEnabled();

    await page.getByTestId("paywall-pay-button").click();

    await expect(page.getByText(/Payment Successful/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/daily pack credits/i)).toBeVisible();

    await page.getByRole("button", { name: /Back to Home/i }).click();
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible({ timeout: 8000 });
  });
});
