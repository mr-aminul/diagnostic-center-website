import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PriceListTable } from "@/components/site/price-list-table";
import { getTests } from "@/lib/data/catalog";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "priceList.title", descriptionKey: "priceList.subtitle" });
}

export default async function PriceListPage() {
  const t = await getTranslations("priceList");
  const locale = (await getLocale()) as Locale;
  const tests = await getTests();

  const rows = tests.map((test) => ({
    id: test.id,
    name: test.name,
    nameBn: test.nameBn,
    price: Number(test.price),
    category: {
      name: test.category.name,
      nameBn: test.category.nameBn,
    },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-10">
          <PriceListTable tests={rows} locale={locale} />
        </div>
    </div>
  );
}
