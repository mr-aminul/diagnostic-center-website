import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";
import type { SiteConfig } from "@/config/site";

/**
 * Turns a brand color into a readable foreground color
 * (near-white or near-black) using relative luminance.
 */
function getReadableForeground(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;

  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return luminance > 0.55 ? "#0a0a0a" : "#fafafa";
}

/**
 * Builds the CSS that overrides the neutral shadcn defaults in globals.css
 * with this center's brand colors (light + dark).
 *
 * Dark brand rules use `html.dark` so they beat the generic `.dark` neutrals
 * in globals.css. Future UI should keep using semantic tokens
 * (`bg-background`, `text-foreground`, `bg-primary`, …) — those flip
 * automatically when the admin theme adds/removes `.dark` on `<html>`.
 */
export function buildThemeCss(theme: SiteConfig["theme"] = siteConfig.theme): string {
  const { primary, secondary, accent, radius } = theme;
  const primaryFg = getReadableForeground(primary);
  const secondaryFg = getReadableForeground(secondary);
  const accentFg = getReadableForeground(accent);

  return `:root {
  --primary: ${primary};
  --primary-foreground: ${primaryFg};
  --secondary: ${secondary};
  --secondary-foreground: ${secondaryFg};
  --accent: ${accent};
  --accent-foreground: ${accentFg};
  --ring: ${primary};
  --radius: ${radius};
  --sidebar-primary: ${primary};
  --sidebar-primary-foreground: ${primaryFg};
  --sidebar-ring: ${primary};
}

html.dark {
  --primary: ${primary};
  --primary-foreground: ${primaryFg};
  --secondary: color-mix(in oklab, ${primary} 16%, oklch(0.22 0 0));
  --secondary-foreground: oklch(0.985 0 0);
  --accent: color-mix(in oklab, ${accent} 42%, oklch(0.28 0 0));
  --accent-foreground: oklch(0.985 0 0);
  --ring: ${primary};
  --sidebar-primary: ${primary};
  --sidebar-primary-foreground: ${primaryFg};
  --sidebar-ring: ${primary};
}`;
}

/**
 * A new center starts with no logo file, so header/footer fall back to a
 * stethoscope mark. Once a center drops a real file at public/logo.svg
 * (per site config), this flips the server-rendered UI over to the
 * actual image with no code changes needed.
 */
let customLogoCached: boolean | undefined;

export function hasCustomLogo(logoSrc: string = siteConfig.logo.src): boolean {
  if (customLogoCached !== undefined) return customLogoCached;
  try {
    const relativePath = logoSrc.replace(/^\//, "");
    customLogoCached = fs.existsSync(
      path.join(process.cwd(), "public", relativePath),
    );
  } catch {
    customLogoCached = false;
  }
  return customLogoCached;
}
