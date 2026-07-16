import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Dev image optimization on multi‑MB local PNGs/JPGs dominates TTFB.
    // Production still runs the optimizer.
    unoptimized: process.env.NODE_ENV === "development",
  },
  async redirects() {
    return [
      {
        source: "/track",
        destination: "/patient-portal",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/track",
        destination: "/:locale/patient-portal",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
