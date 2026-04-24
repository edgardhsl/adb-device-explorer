import { expect, test } from "@playwright/test";
import { translations } from "../../src/lib/i18n";
import { buildBreadcrumbs, buildNavigationGroups } from "../../src/lib/workspace-navigation";

test.describe("Unit: Workspace Navigation", () => {
  test("includes file explorer in workspace navigation when device is selected", () => {
    const t = translations.en;
    const groups = buildNavigationGroups(t, {
      canOpenOverview: true,
      canOpenDatabases: false,
      canOpenFileExplorer: true,
      canOpenLogcat: true,
      hasSelectedDevice: true,
    });

    const workspace = groups.find((group) => group.label === t.navigation.workspace);
    const fileExplorerItem = workspace?.items.find((item) => item.id === "file-explorer");

    expect(fileExplorerItem).toBeTruthy();
    expect(fileExplorerItem?.kind).toBe("view");
  });

  test("hides file explorer when no device is selected", () => {
    const t = translations.en;
    const groups = buildNavigationGroups(t, {
      canOpenOverview: false,
      canOpenDatabases: false,
      canOpenFileExplorer: false,
      canOpenLogcat: false,
      hasSelectedDevice: false,
    });

    const workspace = groups.find((group) => group.label === t.navigation.workspace);
    const hasFileExplorer = workspace?.items.some((item) => item.id === "file-explorer");

    expect(hasFileExplorer).toBeFalsy();
  });

  test("builds breadcrumbs for file explorer workspace", () => {
    const t = translations.en;
    const breadcrumbs = buildBreadcrumbs(t, "fileExplorer");

    expect(breadcrumbs).toEqual([t.breadcrumbs.workspace, t.breadcrumbs.fileExplorer]);
  });
});
