import { expect, test } from "@playwright/test";
import { selectMockDevice } from "./helpers";

test.describe("Feature: File Explorer", () => {
  test("navigates inside mock directories", async ({ page }) => {
    await selectMockDevice(page);

    await page.locator("aside").getByRole("button", { name: /File Explorer/i }).click();

    await expect(page.getByText(/Device File Explorer/i)).toBeVisible();
    await expect(page.getByText(/Download/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Download/i }).first().click();
    await expect(page.getByText("/sdcard/Download")).toBeVisible();
    await expect(page.getByText(/build-debug\.apk/i)).toBeVisible();
  });
});
