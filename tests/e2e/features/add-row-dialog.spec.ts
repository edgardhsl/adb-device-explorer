import { expect, test } from "@playwright/test";
import { openSettingsTable } from "./helpers";

test.describe("Feature: Add Row Dialog", () => {
  test("opens and closes add row dialog", async ({ page }) => {
    await openSettingsTable(page);

    await page.getByRole("button", { name: /Adicionar Linha|Add Row|Agregar Fila/i }).click();
    await expect(page.getByText(/Adicionar Nova Linha|Add New Row|Agregar Nueva Fila/i)).toBeVisible();

    await page.getByRole("button", { name: /Cancelar|Cancel/i }).click();
    await expect(page.getByText(/Adicionar Nova Linha|Add New Row|Agregar Nueva Fila/i)).toHaveCount(0);
  });
});
