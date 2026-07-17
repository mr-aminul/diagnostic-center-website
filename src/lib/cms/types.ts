import type { Locale, LocalizedText, SiteConfig } from "@/config/site";

export type CmsStepKey = "book" | "confirm" | "collect" | "report";

export interface CmsStep {
  title: LocalizedText;
  desc: LocalizedText;
}

export interface CmsAboutContent {
  missionTitle: LocalizedText;
  missionBody: LocalizedText;
  accreditationTitle: LocalizedText;
  accreditationBody: LocalizedText;
}

export interface CmsHomeCollectionContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  howItWorksTitle: LocalizedText;
  cta: LocalizedText;
  steps: Record<CmsStepKey, CmsStep>;
}

export interface CmsBranding {
  name: string;
  shortName: string;
  tagline: LocalizedText;
  description: LocalizedText;
  logo: SiteConfig["logo"];
  theme: SiteConfig["theme"];
}

export interface CmsContact {
  phones: string[];
  whatsapp: string;
  email: string;
  hours: LocalizedText;
  social: SiteConfig["social"];
}

export interface CmsSiteSettings {
  branding: CmsBranding;
  contact: CmsContact;
  features: SiteConfig["features"];
  payment: SiteConfig["payment"];
  seo: SiteConfig["seo"];
  about: CmsAboutContent;
  homeCollection: CmsHomeCollectionContent;
}

/** Runtime site config used by public pages — siteConfig shape + CMS page blocks. */
export interface ResolvedSiteConfig extends SiteConfig {
  about: CmsAboutContent;
  homeCollection: CmsHomeCollectionContent;
}

export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en || text.bn || "";
}
