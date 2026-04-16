import { useMemo } from "react";
import type { Device } from "@/lib/types";
import type { TranslationKeys } from "@/lib/i18n";
import { buildBreadcrumbs, buildNavigationGroups, type WorkspaceView } from "@/lib/workspace-navigation";

type UseWorkspaceStateParams = {
  t: TranslationKeys;
  workspaceView: WorkspaceView;
  devicesCount: number;
  currentDevice?: Device;
  selectedPackage: string | null;
};

export function useWorkspaceState({
  t,
  workspaceView,
  devicesCount,
  currentDevice,
  selectedPackage,
}: UseWorkspaceStateParams) {
  return useMemo(() => {
    const isDatabaseView = workspaceView === "databases";
    const isLogcatView = workspaceView === "logcat";
    const isSettingsView = workspaceView === "settings";
    const showOverview = workspaceView === "overview";
    const hasAnyDevice = devicesCount > 0;
    const hasSelectedDevice = !!currentDevice;
    const hasSelectedApp = !!selectedPackage;
    const canOpenOverview = hasSelectedDevice;
    const canOpenDatabases = hasSelectedDevice && hasSelectedApp;
    const canOpenLogcat = hasSelectedDevice;

    const navGroups = buildNavigationGroups(t, {
      canOpenOverview,
      canOpenDatabases,
      canOpenLogcat,
      hasSelectedDevice,
    });

    const breadcrumbItems = buildBreadcrumbs(t, workspaceView);

    const workspaceDescription = showOverview
      ? t.main.overviewDescription
      : isDatabaseView
        ? t.main.databasesDescription
        : isLogcatView
          ? t.main.logcatDescription
        : t.main.settingsDescription;

    return {
      isDatabaseView,
      isLogcatView,
      isSettingsView,
      showOverview,
      hasAnyDevice,
      hasSelectedDevice,
      hasSelectedApp,
      canOpenOverview,
      canOpenDatabases,
      canOpenLogcat,
      navGroups,
      breadcrumbItems,
      workspaceDescription,
    };
  }, [currentDevice, devicesCount, selectedPackage, t, workspaceView]);
}
