import { Page } from "@playwright/test";

export async function openSettingsTable(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Mock Android Device/i }).click();
  await page.getByRole("button", { name: /com\.example\.demo\.app/i }).click();
  await page.getByRole("button", { name: /demo_data\.db/i }).click();
  await page.getByRole("button", { name: /settings/i }).click();
}
