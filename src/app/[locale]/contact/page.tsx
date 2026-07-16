import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig, type Locale } from "@/config/site";
import { getBranches } from "@/lib/data/branches";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "contact.title", descriptionKey: "contact.subtitle" });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const branches = await getBranches();
  const mainBranch = branches.find((b) => b.isMain) ?? branches[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{tCommon("phone")}</p>
                    <p className="text-sm text-muted-foreground">
                      {siteConfig.contact.phones.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{tCommon("email")}</p>
                    <p className="text-sm text-muted-foreground">{siteConfig.contact.email}</p>
                  </div>
                </div>
                {mainBranch && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{tCommon("address")}</p>
                      <p className="text-sm text-muted-foreground">
                        {locale === "bn" && mainBranch.addressBn
                          ? mainBranch.addressBn
                          : mainBranch.address}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{tCommon("workingHours")}</p>
                    <p className="text-sm text-muted-foreground">{siteConfig.hours[locale]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mainBranch?.mapUrl && (
              <div className="aspect-video overflow-hidden rounded-lg border">
                <iframe
                  src={mainBranch.mapUrl}
                  title={mainBranch.name}
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <ContactForm />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
