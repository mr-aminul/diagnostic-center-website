import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ServicesCatalog } from "@/components/site/services-catalog";
import { getTestCategories, getTests } from "@/lib/data/catalog";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "services.title", descriptionKey: "services.subtitle" });
}

export default async function ServicesPage() {
  const t = await getTranslations("services");
  const locale = (await getLocale()) as Locale;

  const [tests, categories] = await Promise.all([getTests(), getTestCategories()]);

  const plainTests = tests.map((test) => ({
    id: test.id,
    name: test.name,
    nameBn: test.nameBn,
    price: Number(test.price),
    sampleType: test.sampleType,
    preparation: test.preparation,
    preparationBn: test.preparationBn,
    turnaroundTime: test.turnaroundTime,
    category: {
      id: test.category.id,
      name: test.category.name,
      nameBn: test.category.nameBn,
    },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-10">
        <ServicesCatalog tests={plainTests} categories={categories} locale={locale} />
      </div>
    </div>
  );
}
