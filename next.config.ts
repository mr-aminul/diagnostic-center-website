import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone is for Docker/VPS images only. Vercel uses its own Next.js
  // builder — forcing standalone there breaks routing (404 NOT_FOUND).
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
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
