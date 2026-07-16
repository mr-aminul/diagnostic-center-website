import { buildBrandMarkIconSvg } from "@/lib/brand-mark-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

/** Tab favicon — same stethoscope mark as the site header BrandMark. */
export default function Icon() {
  return new Response(buildBrandMarkIconSvg(size.width), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
