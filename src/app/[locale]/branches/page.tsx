import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBranches } from "@/lib/data/branches";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "branches.title", descriptionKey: "branches.subtitle" });
}

export default async function BranchesPage() {
  const t = await getTranslations("branches");
  const locale = (await getLocale()) as Locale;
  const branches = await getBranches();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">
                    {locale === "bn" && branch.nameBn ? branch.nameBn : branch.name}
                  </h3>
                  {branch.isMain && <Badge>Main</Badge>}
                </div>
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {locale === "bn" && branch.addressBn ? branch.addressBn : branch.address}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {branch.phone}
                </p>
                {branch.mapUrl && (
                  <>
                    <div className="mt-4 aspect-video overflow-hidden rounded-md border">
                      <iframe
                        src={branch.mapUrl}
                        title={branch.name}
                        className="h-full w-full"
                        loading="lazy"
                      />
                    </div>
                    <a
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "outline", className: "mt-4 w-full" })}
                    >
                      {t("getDirections")}
                    </a>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
