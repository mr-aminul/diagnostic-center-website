import Image from "next/image";
import { Stethoscope } from "lucide-react";
import { siteConfig } from "@/config/site";
import { hasCustomLogo } from "@/lib/theme";

/**
 * Renders the center's real logo once one exists at public/logo.svg,
 * otherwise falls back to a stethoscope mark so new centers have a usable
 * brand icon from the very first deploy.
 */
export function BrandMark({ size = 36 }: { size?: number }) {
  if (hasCustomLogo()) {
    return (
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.shortName}
        width={size}
        height={size}
        className="rounded-lg object-contain"
      />
    );
  }

  const iconSize = Math.round(size * 0.55);

  return (
    <span
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden
    >
      <Stethoscope style={{ width: iconSize, height: iconSize }} strokeWidth={2.25} />
    </span>
  );
}
