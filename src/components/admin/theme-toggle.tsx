"use client";

import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/components/admin/admin-theme-provider";
import { Button } from "@/components/ui/button";

/**
 * Pins light or dark for the admin console. Prefer semantic tokens
 * (`bg-background`, `text-muted-foreground`, `border-border`, …) in new UI
 * so it follows this toggle with no extra work.
 */
export function ThemeToggle({
  size = "icon",
}: {
  size?: "icon" | "icon-sm";
}) {
  const { resolvedTheme, setTheme } = useAdminTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
