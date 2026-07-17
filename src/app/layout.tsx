import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Roboto } from "next/font/google";
import { NavigationProgress } from "@/components/navigation-progress";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { ADMIN_THEME_INIT_SCRIPT } from "@/lib/admin-theme";
import { buildThemeCss } from "@/lib/theme";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

/**
 * Root layout is intentionally minimal: locale-specific chrome (header,
 * footer, translated nav) lives in app/[locale]/layout.tsx. This layout only
 * sets up the HTML shell, language attribute, and this center's brand
 * colors, so /admin (which has no locale segment) shares the same theme.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const [locale, site] = await Promise.all([getLocale(), getResolvedSiteConfig()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss(site.theme) }} />
        <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${roboto.variable} min-h-screen font-sans antialiased`}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
