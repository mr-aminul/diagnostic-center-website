import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  Syringe,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const STEP_ICONS = [CalendarCheck, ClipboardCheck, Syringe, FileCheck2] as const;
const STEP_KEYS = ["book", "confirm", "collect", "report"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "homeCollection.title",
    descriptionKey: "homeCollection.subtitle",
  });
}

export default async function HomeCollectionPage() {
  const t = await getTranslations("homeCollection");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-8 -ml-2 gap-2 text-muted-foreground",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {tCommon("back")}
        </Link>

        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-secondary lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
              <Image
                src="/banners/hero-home-collection.png"
                alt={t("title")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 34rem"
                priority
              />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="mt-8">
              <Link
                href={{ pathname: "/book", query: { collection: "home" } }}
                className={buttonVariants({ size: "lg" })}
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 max-w-3xl lg:mt-20">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("howItWorksTitle")}
          </h2>
          <ol className="mt-6 divide-y divide-border/80 border-y border-border/80">
            {STEP_KEYS.map((key, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li key={key} className="flex gap-4 py-5 sm:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                      <h3 className="font-semibold">{t(`steps.${key}.title`)}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {t(`steps.${key}.desc`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
    </div>
  );
}
