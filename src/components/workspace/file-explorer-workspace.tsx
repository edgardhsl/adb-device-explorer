import { useMemo } from "react";
import { File, Folder, Home, RefreshCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TranslationKeys } from "@/lib/i18n";
import type { DeviceFileEntry, Theme } from "@/lib/types";

type FileExplorerWorkspaceProps = {
  theme: Theme;
  t: TranslationKeys;
  hasSelectedDevice: boolean;
  currentPath: string;
  entries: DeviceFileEntry[];
  loading: boolean;
  loadError: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onOpenEntry: (entry: DeviceFileEntry) => void;
  onNavigateUp: () => void;
  onGoRoot: () => void;
  onRetry: () => void;
};

const formatBytes = (value?: number) => {
  if (!value || value <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  const normalized = idx === 0 ? Math.round(size).toString() : size.toFixed(1);
  return `${normalized} ${units[idx]}`;
};

export function FileExplorerWorkspace({
  theme,
  t,
  hasSelectedDevice,
  currentPath,
  entries,
  loading,
  loadError,
  searchQuery,
  onSearchQueryChange,
  onOpenEntry,
  onNavigateUp,
  onGoRoot,
  onRetry,
}: FileExplorerWorkspaceProps) {
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [entries, searchQuery]);

  if (!hasSelectedDevice) {
    return (
      <div
        className={cn(
          "grid min-h-[340px] place-items-center rounded-lg border p-6 text-center",
          theme === "dark" ? "border-[#2f2f2f] bg-[#171717]" : "border-slate-300 bg-white"
        )}
      >
        <div>
          <p className={cn("text-sm font-semibold", theme === "dark" ? "text-zinc-100" : "text-slate-900")}>
            {t.main.lockConnectAndRefresh}
          </p>
          <p className={cn("mt-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-slate-500")}>
            {t.main.connectDeviceOverlay}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h2 className={cn("text-sm font-semibold", theme === "dark" ? "text-zinc-50" : "text-slate-900")}>
          {t.main.fileExplorerTitle}
        </h2>
        <p className={cn("text-xs", theme === "dark" ? "text-zinc-400" : "text-slate-600")}>
          {t.main.fileExplorerSubtitle}
        </p>
      </header>

      <div
        className={cn(
          "rounded-lg border p-3",
          theme === "dark" ? "border-[#2f2f2f] bg-[#171717]" : "border-slate-300 bg-white"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={onNavigateUp}>
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            ..
          </Button>
          <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={onGoRoot}>
            <Home className="mr-1 h-3.5 w-3.5" />
            {t.main.fileExplorerOpenRoot}
          </Button>
          <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={onRetry}>
            <RefreshCcw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
            {t.actions.retry}
          </Button>
          <Input
            className="h-8 max-w-sm text-xs"
            placeholder={t.main.fileExplorerSearchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>

        <p className={cn("mt-3 break-all text-[11px]", theme === "dark" ? "text-zinc-400" : "text-slate-600")}>
          <span className="font-semibold">{t.main.fileExplorerCurrentPath}: </span>
          {currentPath}
        </p>

        <ScrollArea className="mt-3 h-[440px] rounded-md border border-slate-300/70 dark:border-[#343434]">
          <div className="p-2">
            {loadError && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2 text-xs text-rose-500">
                {t.errors.loadFailed}
              </div>
            )}

            {!loadError && filteredEntries.length === 0 && (
              <div className={cn("px-2 py-3 text-xs", theme === "dark" ? "text-zinc-400" : "text-slate-500")}>
                {t.main.fileExplorerEmpty}
              </div>
            )}

            {!loadError &&
              filteredEntries.map((entry) => (
                <button
                  key={entry.full_path}
                  type="button"
                  onClick={() => onOpenEntry(entry)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors",
                    theme === "dark"
                      ? "text-zinc-200 hover:bg-[#242424]"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {entry.is_directory ? (
                      <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <File className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className={cn("shrink-0 text-[11px]", theme === "dark" ? "text-zinc-400" : "text-slate-500")}>
                    {entry.is_directory ? "-" : formatBytes(entry.size_bytes)}
                  </span>
                </button>
              ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
