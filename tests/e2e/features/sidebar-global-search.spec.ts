import { expect, test } from "@playwright/test";

test.describe("Feature: Sidebar Global Search", () => {
  test("supports global sidebar search and empty state", async ({ page }) => {
    await page.goto("/");

    const globalSearch = page.locator("aside input").first();
    await globalSearch.fill("Mock Android");
    await expect(page.getByText("Mock Android Device")).toBeVisible();

    await globalSearch.fill("no-match-value");
    await expect(page.getByText(/Nenhum resultado|No results|No se encontraron/)).toBeVisible();
  });
});
