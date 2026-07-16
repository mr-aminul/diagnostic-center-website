import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Roboto } from "next/font/google";
import { NavigationProgress } from "@/components/navigation-progress";
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
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
      </head>
      <body className={`${roboto.variable} min-h-screen font-sans antialiased`}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
