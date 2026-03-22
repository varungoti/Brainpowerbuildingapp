import { test, expect } from "@playwright/test";

test.describe("NeuroSpark shell", () => {
  test("serves app and shows NeuroSpark branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).toBeVisible();
    await expect(page.getByText(/NeuroSpark/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
