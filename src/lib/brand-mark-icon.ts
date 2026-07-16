import { siteConfig } from "@/config/site";

/**
 * Readable foreground for a solid brand fill — mirrors the contrast logic
 * in theme.ts so the favicon matches the header BrandMark colors.
 */
function getReadableForeground(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;

  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const luminance =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return luminance > 0.55 ? "#0a0a0a" : "#fafafa";
}

/**
 * SVG for the stethoscope-in-rounded-square mark used in the header when no
 * custom logo.svg is present. Sized for favicon / app icon use.
 */
export function buildBrandMarkIconSvg(size = 32): string {
  const background = siteConfig.theme.primary;
  const foreground = getReadableForeground(background);
  // Match BrandMark: icon is ~55% of the square, centered.
  const iconSize = size * 0.55;
  const offset = (size - iconSize) / 2;
  const scale = iconSize / 24;
  // rounded-lg ≈ 0.625rem on a 36px mark → ~22% of the side.
  const radius = Math.round(size * 0.22);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" stroke="${foreground}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 2v2"/>
    <path d="M5 2v2"/>
    <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/>
    <path d="M8 15a6 6 0 0 0 12 0v-3"/>
    <circle cx="20" cy="10" r="2"/>
  </g>
</svg>`;
}
