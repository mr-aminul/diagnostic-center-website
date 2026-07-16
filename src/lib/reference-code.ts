import { randomInt } from "node:crypto";
import { siteConfig } from "@/config/site";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion when read aloud

function centerPrefix(): string {
  const initials = siteConfig.shortName
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return initials.slice(0, 3) || "DX";
}

export function generateReferenceCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `${centerPrefix()}-${suffix}`;
}
