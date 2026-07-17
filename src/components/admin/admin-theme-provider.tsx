"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { ADMIN_THEME_STORAGE_KEY } from "@/lib/admin-theme";
import { Toaster } from "@/components/ui/sonner";

/**
 * Admin-only theme scope. Puts `.dark` on `<html>` so portaled overlays
 * (dialogs, selects, toasts) inherit tokens; clears it on leave so the
 * public site stays light.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.style.removeProperty("color-scheme");
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={ADMIN_THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
