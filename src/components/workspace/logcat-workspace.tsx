import { useEffect, useMemo, useRef } from "react";
import { AppWindow, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseLogcatLevel } from "@/lib/logcat-utils";
import type { TranslationKeys } from "@/lib/i18n";
import type { Theme } from "@/lib/types";

type LogcatWorkspaceProps = {
  theme: Theme;
  t: TranslationKeys;
  hasSelectedDevice: boolean;
  selectedPackage: string | null;
  isCapturing: boolean;
  onToggleCapture: () => void;
  onClearLogs: () => void;
  filterQuery: string;
  onFilterQueryChange: (value: string) => void;
  onlySelectedApp: boolean;
  onToggleOnlySelectedApp: () => void;
  invalidFilterPattern: boolean;
  entries: string[];
  totalEntries: number;
  fetching: boolean;
};

const LEVEL_COLORS: Record<string, string> = {
  V: "text-slate-500 dark:text-zinc-500",
  D: "text-sky-600 dark:text-sky-300",
  I: "text-emerald-600 dark:text-emerald-300",
  W: "text-amber-600 dark:text-amber-300",
  E: "text-rose-600 dark:text-rose-300",
  F: "text-red-700 dark:text-red-300",
  A: "text-red-700 dark:text-red-300",
};

export function LogcatWorkspace({
  theme,
  t,
  hasSelectedDevice,
  selectedPackage,
  isCapturing,
  onToggleCapture,
  onClearLogs,
  filterQuery,
  onFilterQueryChange,
  onlySelectedApp,
  onToggleOnlySelectedApp,
  invalidFilterPattern,
  entries,
  totalEntries: _totalEntries,
  fetching: _fetching,
}: LogcatWorkspaceProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previousEntriesCountRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const nearBottomThreshold = 96;

  const computeIsNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - (el.scrollTop + el.clientHeight) <= nearBottomThreshold;

  const handleViewportScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    stickToBottomRef.current = computeIsNearBottom(viewport);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const previousCount = previousEntriesCountRef.current;
    const nextCount = entries.length;
    previousEntriesCountRef.current = nextCount;

    if (nextCount <= previousCount) return;

    if (previousCount === 0 && nextCount > 0) {
      requestAnimationFrame(() => {
        const el = viewportRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        stickToBottomRef.current = true;
      });
      return;
    }

    if (!stickToBottomRef.current) return;

    requestAnimationFrame(() => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
    });
  }, [entries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }

      if (event.key === "End") {
        event.preventDefault();
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      }

      if (event.key === "Home") {
        event.preventDefault();
        viewport.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleEntries = useMemo(
    () =>
      entries.map((line, index) => ({
        id: `${index}-${line}`,
        raw: line,
        level: parseLogcatLevel(line),
      })),
    [entries]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Card className="rounded-2xl border-border bg-surface backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-base", theme === "dark" ? "text-zinc-100" : "text-slate-900")}>
            {t.main.logcatTitle}
          </CardTitle>
          <CardDescription className={cn("text-xs", theme === "dark" ? "text-zinc-400" : "text-slate-600")}>
            {t.main.logcatSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <Input
              value={filterQuery}
              onChange={(event) => onFilterQueryChange(event.target.value)}
              placeholder={t.main.logcatFilterPlaceholder}
              className={cn(
                "h-9 text-xs",
                theme === "dark" ? "border-[#3a3a3a] bg-[#232323] text-zinc-100 placeholder:text-zinc-500" : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400",
                invalidFilterPattern && "border-rose-400"
              )}
            />
            <Button
              type="button"
              variant={onlySelectedApp ? "default" : "secondary"}
              onClick={onToggleOnlySelectedApp}
              disabled={!selectedPackage}
              className={cn(
                "h-9 w-9 rounded-xl p-0",
                !onlySelectedApp &&
                  (theme === "dark"
                    ? "bg-white/10 text-zinc-100 hover:bg-white/15"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              )}
              title={t.main.logcatFilterSelectedApp}
              aria-label={t.main.logcatFilterSelectedApp}
            >
              <AppWindow className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={isCapturing ? "default" : "secondary"}
              onClick={onToggleCapture}
              disabled={!hasSelectedDevice}
              className={cn("h-9 w-9 rounded-xl p-0", !isCapturing && (theme === "dark" ? "bg-white/10 text-zinc-100 hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"))}
              title={isCapturing ? t.main.logcatPause : t.main.logcatResume}
              aria-label={isCapturing ? t.main.logcatPause : t.main.logcatResume}
            >
              {isCapturing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClearLogs}
              className={cn("h-9 w-9 rounded-xl p-0", theme === "dark" ? "border-[#3a3a3a] bg-[#232323] text-zinc-100 hover:bg-[#2a2a2a]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100")}
              title={t.main.logcatClear}
              aria-label={t.main.logcatClear}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {invalidFilterPattern && <div className="text-xs text-rose-500">{t.main.logcatInvalidRegex}</div>}
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-border bg-surface backdrop-blur-xl">
        <CardContent className="min-h-0 flex-1 p-0">
          <div
            ref={viewportRef}
            onScroll={handleViewportScroll}
            className={cn("h-full overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed", theme === "dark" ? "bg-[#181818]" : "bg-[#f4f4f5]")}
          >
            {!hasSelectedDevice ? (
              <p className={cn("py-8 text-center text-xs", theme === "dark" ? "text-zinc-500" : "text-slate-500")}>{t.main.lockSelectConnectedDevice}</p>
            ) : visibleEntries.length === 0 ? (
              <p className={cn("py-8 text-center text-xs", theme === "dark" ? "text-zinc-500" : "text-slate-500")}>{t.main.logcatNoLogs}</p>
            ) : (
              <div className="space-y-1">
                {visibleEntries.map((entry) => (
                  <p key={entry.id} className={cn("break-all", LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.I)}>
                    {entry.raw}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
