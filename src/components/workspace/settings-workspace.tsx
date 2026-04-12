import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKeys } from "@/lib/i18n";
import type { AppConfig, Theme } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsWorkspaceProps = {
  theme: Theme;
  t: TranslationKeys;
  config: AppConfig | null;
  saving: boolean;
  onSave: (payload: { opensslDir: string; opensslLibDir: string; opensslIncludeDir: string }) => void;
};

export function SettingsWorkspace({ theme, t, config, saving, onSave }: SettingsWorkspaceProps) {
  const [opensslDir, setOpensslDir] = useState("");
  const [opensslLibDir, setOpensslLibDir] = useState("");
  const [opensslIncludeDir, setOpensslIncludeDir] = useState("");

  useEffect(() => {
    if (!config) return;
    setOpensslDir(config.openssl_dir ?? "");
    setOpensslLibDir(config.openssl_lib_dir ?? "");
    setOpensslIncludeDir(config.openssl_include_dir ?? "");
  }, [config]);

  return (
    <Card className="border-border bg-surface backdrop-blur-xl">
      <CardHeader>
        <CardTitle className={cn("text-base", theme === "dark" ? "text-zinc-100" : "text-slate-900")}>
          {t.settings.title}
        </CardTitle>
        <CardDescription className={cn("text-xs", theme === "dark" ? "text-zinc-400" : "text-slate-600")}>
          {t.settings.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="environment" className="w-full">
          <TabsList>
            <TabsTrigger value="environment">{t.settings.environmentTab}</TabsTrigger>
            <TabsTrigger value="general">{t.settings.generalTab}</TabsTrigger>
          </TabsList>

          <TabsContent value="environment" className="space-y-4">
            <div className="space-y-2">
              <p className={cn("text-xs font-semibold", theme === "dark" ? "text-zinc-300" : "text-slate-700")}>{t.settings.opensslDir}</p>
              <Input
                value={opensslDir}
                onChange={(event) => setOpensslDir(event.target.value)}
                placeholder="C:\\OpenSSL-Win64"
                className={cn(theme === "dark" ? "border-[#3a3a3a] bg-[#232323] text-zinc-100 placeholder:text-zinc-500" : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400")}
              />
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-semibold", theme === "dark" ? "text-zinc-300" : "text-slate-700")}>{t.settings.opensslLibDir}</p>
              <Input
                value={opensslLibDir}
                onChange={(event) => setOpensslLibDir(event.target.value)}
                placeholder="C:\\OpenSSL-Win64\\lib"
                className={cn(theme === "dark" ? "border-[#3a3a3a] bg-[#232323] text-zinc-100 placeholder:text-zinc-500" : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400")}
              />
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-semibold", theme === "dark" ? "text-zinc-300" : "text-slate-700")}>{t.settings.opensslIncludeDir}</p>
              <Input
                value={opensslIncludeDir}
                onChange={(event) => setOpensslIncludeDir(event.target.value)}
                placeholder="C:\\OpenSSL-Win64\\include"
                className={cn(theme === "dark" ? "border-[#3a3a3a] bg-[#232323] text-zinc-100 placeholder:text-zinc-500" : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400")}
              />
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <div className={cn("rounded-xl border px-3 py-2 text-[11px]", theme === "dark" ? "border-white/10 text-zinc-400" : "border-slate-200 text-slate-600")}>
              <span className="font-semibold">{t.settings.preferredLocale}:</span> {config?.preferred_locale || "en"}
            </div>
            <div className={cn("rounded-xl border px-3 py-2 text-[11px]", theme === "dark" ? "border-white/10 text-zinc-400" : "border-slate-200 text-slate-600")}>
              <span className="font-semibold">{t.settings.configFile}:</span> {config?.config_file_path || "-"}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          onClick={() =>
            onSave({
              opensslDir,
              opensslLibDir,
              opensslIncludeDir,
            })
          }
          disabled={saving}
          className="h-10 rounded-xl"
        >
          <Save className="mr-2 h-4 w-4" />
          {t.settings.save}
        </Button>
      </CardContent>
    </Card>
  );
}
