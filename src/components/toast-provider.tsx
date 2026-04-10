"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      expand
      closeButton
      toastOptions={{
        classNames: {
          toast: "!bg-white dark:!bg-slate-900 !text-slate-800 dark:!text-slate-100 !border !border-slate-200 dark:!border-slate-700 !shadow-xl",
          title: "!font-semibold",
          description: "!text-slate-500 dark:!text-slate-400",
          success: "!bg-emerald-50 dark:!bg-emerald-900/30 !text-emerald-900 dark:!text-emerald-100 !border-emerald-300 dark:!border-emerald-700",
          error: "!border-rose-300 dark:!border-rose-700",
          warning: "!border-amber-300 dark:!border-amber-700",
          info: "!border-sky-300 dark:!border-sky-700",
        },
      }}
    />
  );
}
