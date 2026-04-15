import { expect, test } from "@playwright/test";

test.describe("Feature: Language Switch", () => {
  test("changes language from PT to EN", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^PT$/i }).click();
    await page.getByRole("button", { name: /^EN$/i }).click();

    await expect(page.getByRole("button", { name: /Refresh ADB/i })).toBeVisible();
  });
});
