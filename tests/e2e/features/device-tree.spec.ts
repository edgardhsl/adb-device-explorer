import { expect, test } from "@playwright/test";

test.describe("Feature: Device Tree", () => {
  test("loads mocked device and package tree", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Mock Android Device")).toBeVisible();

    await page.getByRole("button", { name: /Mock Android Device/i }).click();
    await expect(page.getByText("com.example.demo.app")).toBeVisible();
    await expect(page.getByText("com.example.tools.viewer")).toBeVisible();
  });
});
