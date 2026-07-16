import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DoctorsDirectory } from "@/components/site/doctors-directory";
import { getDoctors } from "@/lib/data/doctors";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "doctors.title", descriptionKey: "doctors.subtitle" });
}

export default async function DoctorsPage() {
  const t = await getTranslations("doctors");
  const locale = (await getLocale()) as Locale;
  const doctors = await getDoctors();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-10">
          {doctors.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
          ) : (
            <DoctorsDirectory doctors={doctors} locale={locale} />
          )}
        </div>
    </div>
  );
}
