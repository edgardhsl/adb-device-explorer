import { expect, test } from "@playwright/test";
import { openSettingsTable } from "./helpers";

test.describe("Feature: Table Filter", () => {
  test("filters rows in mocked table", async ({ page }) => {
    await openSettingsTable(page);

    const filterInput = page.getByPlaceholder(/filtrar|filter/i);
    await filterInput.fill("3");
    await page.getByRole("button", { name: /aplicar|apply/i }).click();

    await expect(page.getByText("app_mode")).toBeVisible();
    await expect(page.getByText("api_host")).toHaveCount(0);
  });
});
