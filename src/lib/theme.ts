import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";

/**
 * Turns a brand color from site.config.ts into a readable foreground color
 * (near-white or near-black) using relative luminance, so a new center only
 * ever has to pick brand colors — never worry about text contrast.
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
 * with this center's brand colors. Rendered once as an inline <style> tag
 * in the root layout — no Tailwind rebuild needed to re-brand the site.
 */
export function buildThemeCss(): string {
  const { primary, secondary, accent, radius } = siteConfig.theme;

  return `:root {
  --primary: ${primary};
  --primary-foreground: ${getReadableForeground(primary)};
  --secondary: ${secondary};
  --secondary-foreground: ${getReadableForeground(secondary)};
  --accent: ${accent};
  --accent-foreground: ${getReadableForeground(accent)};
  --ring: ${primary};
  --radius: ${radius};
  --sidebar-primary: ${primary};
  --sidebar-primary-foreground: ${getReadableForeground(primary)};
  --sidebar-ring: ${primary};
}`;
}

/**
 * A new center starts with no logo file, so header/footer fall back to a
 * stethoscope mark. Once a center drops a real file at public/logo.svg
 * (per site.config.ts), this flips the server-rendered UI over to the
 * actual image with no code changes needed.
 */
let customLogoCached: boolean | undefined;

export function hasCustomLogo(): boolean {
  if (customLogoCached !== undefined) return customLogoCached;
  try {
    const relativePath = siteConfig.logo.src.replace(/^\//, "");
    customLogoCached = fs.existsSync(
      path.join(process.cwd(), "public", relativePath),
    );
  } catch {
    customLogoCached = false;
  }
  return customLogoCached;
}
