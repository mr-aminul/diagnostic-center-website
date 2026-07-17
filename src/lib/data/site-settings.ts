import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseCmsSettings, toResolvedSiteConfig } from "@/lib/cms/merge";
import type { CmsSiteSettings, ResolvedSiteConfig } from "@/lib/cms/types";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function queryCmsSettings(): Promise<CmsSiteSettings> {
  try {
    const row = await db.siteSettings.findUnique({ where: { id: "default" } });
    return parseCmsSettings(row);
  } catch {
    // Table may not exist yet before the CMS migration is applied.
    return parseCmsSettings(null);
  }
}

/** Dedupes within a request; caches across requests. Safe for Header/Footer. */
export const getCmsSettings = cache(async () =>
  unstable_cache(queryCmsSettings, ["cms-site-settings"], {
    revalidate: 60,
    tags: ["site-settings"],
  })(),
);

export const getResolvedSiteConfig = cache(async (): Promise<ResolvedSiteConfig> =>
  toResolvedSiteConfig(await getCmsSettings()),
);

export async function upsertCmsSettings(data: CmsSiteSettings): Promise<void> {
  const payload = {
    branding: asJson(data.branding),
    contact: asJson(data.contact),
    features: asJson(data.features),
    payment: asJson(data.payment),
    seo: asJson(data.seo),
    about: asJson(data.about),
    homeCollection: asJson(data.homeCollection),
  };

  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...payload },
    update: payload,
  });
}
