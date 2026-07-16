import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Award, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "about.title" });
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-secondary lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
              <Image
                src="/banners/hero-reception.png"
                alt={t("heroImageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 34rem"
                priority
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              {t("title")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
              {siteConfig.tagline[locale]}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {siteConfig.description[locale]}
            </p>

            <dl className="mt-8 divide-y divide-border/80 border-y border-border/80">
              <div className="flex gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold">{t("missionTitle")}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t("missionBody")}
                  </dd>
                </div>
              </div>

              <div className="flex gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold">{t("accreditationTitle")}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t("accreditationBody")}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className={buttonVariants({ size: "lg" })}>
                {tNav("bookNow")}
              </Link>
              <Link
                href="/contact"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {tNav("contact")}
              </Link>
            </div>
          </div>
        </section>
    </div>
  );
}
