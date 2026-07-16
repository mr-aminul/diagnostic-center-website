import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { siteConfig, type Locale } from "@/config/site";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SiteChrome } from "@/components/site/site-chrome";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.shortName}`,
    },
    description: siteConfig.description[activeLocale],
    keywords: siteConfig.seo.keywords,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Loaded eagerly so translation errors surface immediately during dev.
  const t = await getTranslations("common");

  return (
    <NextIntlClientProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <div className="site-page-wash flex min-h-screen flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <SiteChrome />
      </div>
    </NextIntlClientProvider>
  );
}
