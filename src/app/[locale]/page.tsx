import { getLocale, getTranslations } from "next-intl/server";
import {
  Activity,
  CalendarCheck2,
  ClipboardList,
  FileSearch,
  FlaskConical,
  HeartPulse,
  Home as HomeIcon,
  Microscope,
  Package,
  Quote,
  Scan,
  Stethoscope,
  Star,
  UserRoundSearch,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/site/section-heading";
import { DoctorCard } from "@/components/site/doctor-card";
import { DoctorsSlider } from "@/components/site/doctors-slider";
import { GlobalSearchLazy } from "@/components/site/global-search-lazy";
import { HeroImageCarousel } from "@/components/site/hero-image-carousel";
import { PackageCard } from "@/components/site/package-card";
import {
  PromoBannerCarousel,
  type PromoBannerSlide,
} from "@/components/site/promo-banner-carousel";
import type { Locale } from "@/config/site";
import { pickLocalized } from "@/lib/cms/types";
import { getPackages, getTestCategories } from "@/lib/data/catalog";
import { getDoctors } from "@/lib/data/doctors";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { getLocalizedTestimonials } from "@/lib/data/testimonials";
import { cn } from "@/lib/utils";

const HERO_IMAGES = [
  "/banners/hero.png",
  "/banners/hero-pathology-lab.png",
  "/banners/hero-ultrasound.png",
  "/banners/hero-home-collection.png",
  "/banners/hero-reception.png",
  "/banners/hero-consultation.png",
] as const;

const CATEGORY_ICONS = [
  FlaskConical,
  Scan,
  HeartPulse,
  Activity,
  Microscope,
  Stethoscope,
] as const;


export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const site = await getResolvedSiteConfig();

  const [packages, doctors, categories, testimonials] = await Promise.all([
    getPackages(),
    site.features.doctorsPage ? getDoctors() : Promise.resolve([]),
    getTestCategories(),
    site.features.testimonials ? getLocalizedTestimonials(locale) : Promise.resolve([]),
  ]);

  const servicePillars = [
    {
      key: "lab" as const,
      href: "/services" as const,
      Icon: FlaskConical,
    },
    {
      key: "imaging" as const,
      href: "/services" as const,
      Icon: Scan,
    },
    ...(site.features.homeCollection
      ? [
        {
          key: "homeCollection" as const,
          href: "/home-collection" as const,
          Icon: HomeIcon,
        },
      ]
      : [
        {
          key: "packages" as const,
          href: "/packages" as const,
          Icon: Package,
        },
      ]),
  ];

  const heroTasks = [
    {
      key: "findDoctor" as const,
      href: "/doctors" as const,
      Icon: UserRoundSearch,
      show: site.features.doctorsPage,
    },
    {
      key: "reports" as const,
      href: "/patient-portal" as const,
      Icon: FileSearch,
      show: true,
    },
    {
      key: "book" as const,
      href: "/book" as const,
      Icon: CalendarCheck2,
      show: true,
    },
    {
      key: "packages" as const,
      href: "/packages" as const,
      Icon: ClipboardList,
      show: true,
    },
  ].filter((task) => task.show);

  // Locale-specific campaign creatives — illustrated offer ads, not hero photos.
  const promoSuffix = locale === "bn" ? "-bn" : "";
  const promoSlides: PromoBannerSlide[] = [
    ...(packages.length > 0
      ? [
        {
          id: "packages",
          src: `/banners/promo-packages${promoSuffix}.png`,
          alt: t("home.promoBanner.items.packages.alt"),
          href: "/packages" as const,
        },
      ]
      : []),
    ...(site.features.homeCollection
      ? [
        {
          id: "homeCollection",
          src: `/banners/promo-home-collection${promoSuffix}.png`,
          alt: t("home.promoBanner.items.homeCollection.alt"),
          href: "/home-collection" as const,
        },
      ]
      : []),
    {
      id: "reports",
      src: `/banners/promo-online-reports${promoSuffix}.png`,
      alt: t("home.promoBanner.items.reports.alt"),
      href: "/patient-portal" as const,
    },
  ];

  return (
    <div>
      {/* ACT — job-first hero with full-bleed image carousel */}
      <section className="relative isolate overflow-x-hidden border-b bg-secondary">
        <HeroImageCarousel images={HERO_IMAGES} />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-between gap-10 px-4 pt-16 pb-10 sm:px-6 lg:min-h-[80vh] lg:gap-14 lg:px-8 lg:pt-24 lg:pb-14">
          <div className="max-w-3xl text-white">
            <Badge className="mb-4 border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20">
              {t("home.heroEyebrow")}
            </Badge>
            <h1 className="whitespace-nowrap text-[clamp(1.2rem,3.6vw,3rem)] font-bold tracking-tight text-white">
              {site.name}
            </h1>
            <p className="mt-8 text-lg text-white/90 sm:mt-10">
              {site.tagline[locale]}
            </p>
            <p className="mt-3 max-w-xl text-white/75">
              {site.description[locale]}
            </p>
            <GlobalSearchLazy locale={locale} className="mt-8" />
          </div>

          <div
            className={cn(
            "grid gap-3",
              heroTasks.length >= 4
                ? "grid-cols-2 lg:grid-cols-4"
                : heroTasks.length === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2",
            )}
          >
            {heroTasks.map(({ key, href, Icon }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-14 w-full justify-center gap-2 text-sm shadow-sm sm:text-base",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {t(`home.tasks.${key}`)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PromoBannerCarousel slides={promoSlides} />

      {site.features.doctorsPage && doctors.length > 0 && (
        <section className="border-b bg-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading title={t("home.doctorsTitle")} align="left" />
              <Link
                href="/doctors"
                className={buttonVariants({ variant: "outline", className: "w-fit shrink-0" })}
              >
                {t("common.viewAll")}
              </Link>
            </div>

            <DoctorsSlider className="mt-8">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} locale={locale} />
              ))}
            </DoctorsSlider>
          </div>
        </section>
      )}

      {/* BROWSE — services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title={t("home.servicesTitle")}
          subtitle={t("home.servicesSubtitle")}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicePillars.map(({ key, href, Icon }) => (
            <Link key={key} href={href} className="group">
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold">
                    {t(`home.servicePillars.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`home.servicePillars.${key}.desc`)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* BROWSE — categories */}
      {categories.length > 0 && (
        <section className="border-t bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              title={t("home.categoriesTitle")}
              subtitle={t("home.categoriesSubtitle")}
            />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category, index) => {
                const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
                return (
                  <Link
                    key={category.id}
                    href="/services"
                    className="group rounded-xl border bg-background p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  >
                    <Icon
                      className="mx-auto h-7 w-7 text-primary transition-transform group-hover:scale-105"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm font-medium">
                      {locale === "bn" && category.nameBn
                        ? category.nameBn
                        : category.name}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* BROWSE — packages */}
      {packages.length > 0 && (
        <section className="border-t bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              title={t("home.packagesTitle")}
              subtitle={t("home.packagesSubtitle")}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {packages.slice(0, 4).map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  locale={locale}
                  maxIncludes={4}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/packages" className={buttonVariants({ variant: "outline" })}>
                {t("common.viewAll")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About snippet */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              title={t("home.aboutTitle", { name: site.shortName })}
              align="left"
            />
            <p className="mt-6 text-muted-foreground">
              {site.description[locale]}
            </p>
            <p className="mt-4 text-muted-foreground">
              {pickLocalized(site.about.missionBody, locale)}
            </p>
            <Link
              href="/about"
              className={buttonVariants({ variant: "outline", className: "mt-6" })}
            >
              {t("home.aboutCta")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(
              ["accurate", "fast", "homeCollection", "doctors"] as const
            )
              .filter((key) => {
                if (key === "homeCollection") return site.features.homeCollection;
                if (key === "doctors") return site.features.doctorsPage;
                return true;
              })
              .map((key) => (
                <Card key={key}>
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold">
                      {t(`home.whyUs.${key}.title`)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t(`home.whyUs.${key}.desc`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {site.features.testimonials && testimonials.length > 0 && (
        <section className="border-t bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading title={t("home.testimonialsTitle")} />
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.name}>
                  <CardContent className="p-6">
                    <Quote className="h-6 w-6 text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">{item.quote}</p>
                    <div className="mt-4 flex items-center gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="site-cta-band border-0 bg-transparent text-primary-foreground ring-0">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("home.ctaTitle")}</h2>
            <p className="max-w-xl text-primary-foreground/90">{t("home.ctaSubtitle")}</p>
            <Link href="/book" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              {t("home.ctaButton")}
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
