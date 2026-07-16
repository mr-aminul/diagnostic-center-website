import { ImageResponse } from "next/og";
import { buildBrandMarkIconSvg } from "@/lib/brand-mark-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — rasterized brand mark so home-screen bookmarks match
 * the header stethoscope square.
 */
export default function AppleIcon() {
  const svg = buildBrandMarkIconSvg(size.width);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        {/* ImageResponse (Satori) renders <img>; next/image is unavailable here. */}
        <img src={dataUrl} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size },
  );
}
