import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PackageCard } from "@/components/site/package-card";
import { getPackages } from "@/lib/data/catalog";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "packages.title", descriptionKey: "packages.subtitle" });
}

export default async function PackagesPage() {
  const t = await getTranslations("packages");
  const locale = (await getLocale()) as Locale;
  const packages = await getPackages();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-10">
          {packages.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
