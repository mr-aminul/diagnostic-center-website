import { siteConfig } from "@/config/site";
import { getDefaultCmsSettings } from "@/lib/cms/defaults";
import type {
  CmsAboutContent,
  CmsBranding,
  CmsContact,
  CmsHomeCollectionContent,
  CmsSiteSettings,
  ResolvedSiteConfig,
} from "@/lib/cms/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asLocalized(
  value: unknown,
  fallback: { en: string; bn: string },
): { en: string; bn: string } {
  if (!isRecord(value)) return { ...fallback };
  return {
    en: typeof value.en === "string" ? value.en : fallback.en,
    bn: typeof value.bn === "string" ? value.bn : fallback.bn,
  };
}

function mergeBranding(raw: unknown, fallback: CmsBranding): CmsBranding {
  if (!isRecord(raw)) return { ...fallback, tagline: { ...fallback.tagline }, description: { ...fallback.description }, logo: { ...fallback.logo }, theme: { ...fallback.theme } };
  const logo = isRecord(raw.logo) ? raw.logo : {};
  const theme = isRecord(raw.theme) ? raw.theme : {};
  return {
    name: typeof raw.name === "string" ? raw.name : fallback.name,
    shortName: typeof raw.shortName === "string" ? raw.shortName : fallback.shortName,
    tagline: asLocalized(raw.tagline, fallback.tagline),
    description: asLocalized(raw.description, fallback.description),
    logo: {
      src: typeof logo.src === "string" ? logo.src : fallback.logo.src,
      icon: typeof logo.icon === "string" ? logo.icon : fallback.logo.icon,
    },
    theme: {
      primary: typeof theme.primary === "string" ? theme.primary : fallback.theme.primary,
      secondary: typeof theme.secondary === "string" ? theme.secondary : fallback.theme.secondary,
      accent: typeof theme.accent === "string" ? theme.accent : fallback.theme.accent,
      radius: typeof theme.radius === "string" ? theme.radius : fallback.theme.radius,
    },
  };
}

function mergeContact(raw: unknown, fallback: CmsContact): CmsContact {
  if (!isRecord(raw)) {
    return {
      ...fallback,
      phones: [...fallback.phones],
      hours: { ...fallback.hours },
      social: { ...fallback.social },
    };
  }
  const social = isRecord(raw.social) ? raw.social : {};
  const phones = Array.isArray(raw.phones)
    ? raw.phones.filter((phone): phone is string => typeof phone === "string" && phone.trim().length > 0)
    : fallback.phones;
  return {
    phones: phones.length > 0 ? phones : [...fallback.phones],
    whatsapp: typeof raw.whatsapp === "string" ? raw.whatsapp : fallback.whatsapp,
    email: typeof raw.email === "string" ? raw.email : fallback.email,
    hours: asLocalized(raw.hours, fallback.hours),
    social: {
      facebook: typeof social.facebook === "string" ? social.facebook : fallback.social.facebook,
      youtube: typeof social.youtube === "string" ? social.youtube : fallback.social.youtube,
      linkedin: typeof social.linkedin === "string" ? social.linkedin : fallback.social.linkedin,
    },
  };
}

function mergeFeatures(raw: unknown, fallback: CmsSiteSettings["features"]): CmsSiteSettings["features"] {
  if (!isRecord(raw)) return { ...fallback };
  return {
    homeCollection: typeof raw.homeCollection === "boolean" ? raw.homeCollection : fallback.homeCollection,
    multiBranch: typeof raw.multiBranch === "boolean" ? raw.multiBranch : fallback.multiBranch,
    onlinePayment: typeof raw.onlinePayment === "boolean" ? raw.onlinePayment : fallback.onlinePayment,
    testimonials: typeof raw.testimonials === "boolean" ? raw.testimonials : fallback.testimonials,
    doctorsPage: typeof raw.doctorsPage === "boolean" ? raw.doctorsPage : fallback.doctorsPage,
  };
}

function mergeAbout(raw: unknown, fallback: CmsAboutContent): CmsAboutContent {
  if (!isRecord(raw)) {
    return {
      missionTitle: { ...fallback.missionTitle },
      missionBody: { ...fallback.missionBody },
      accreditationTitle: { ...fallback.accreditationTitle },
      accreditationBody: { ...fallback.accreditationBody },
    };
  }
  return {
    missionTitle: asLocalized(raw.missionTitle, fallback.missionTitle),
    missionBody: asLocalized(raw.missionBody, fallback.missionBody),
    accreditationTitle: asLocalized(raw.accreditationTitle, fallback.accreditationTitle),
    accreditationBody: asLocalized(raw.accreditationBody, fallback.accreditationBody),
  };
}

function mergeHomeCollection(
  raw: unknown,
  fallback: CmsHomeCollectionContent,
): CmsHomeCollectionContent {
  if (!isRecord(raw)) return structuredClone(fallback);
  const stepsRaw = isRecord(raw.steps) ? raw.steps : {};
  const stepKeys = ["book", "confirm", "collect", "report"] as const;
  const steps = { ...structuredClone(fallback.steps) };
  for (const key of stepKeys) {
    const step = stepsRaw[key];
    if (!isRecord(step)) continue;
    steps[key] = {
      title: asLocalized(step.title, fallback.steps[key].title),
      desc: asLocalized(step.desc, fallback.steps[key].desc),
    };
  }
  return {
    title: asLocalized(raw.title, fallback.title),
    subtitle: asLocalized(raw.subtitle, fallback.subtitle),
    howItWorksTitle: asLocalized(raw.howItWorksTitle, fallback.howItWorksTitle),
    cta: asLocalized(raw.cta, fallback.cta),
    steps,
  };
}

export function parseCmsSettings(row: {
  branding: unknown;
  contact: unknown;
  features: unknown;
  payment: unknown;
  seo: unknown;
  about: unknown;
  homeCollection: unknown;
} | null): CmsSiteSettings {
  const defaults = getDefaultCmsSettings();
  if (!row) return defaults;

  const paymentRaw = isRecord(row.payment) ? row.payment : {};
  const seoRaw = isRecord(row.seo) ? row.seo : {};
  const keywords = Array.isArray(seoRaw.keywords)
    ? seoRaw.keywords.filter((item): item is string => typeof item === "string")
    : defaults.seo.keywords;

  return {
    branding: mergeBranding(row.branding, defaults.branding),
    contact: mergeContact(row.contact, defaults.contact),
    features: mergeFeatures(row.features, defaults.features),
    payment: {
      provider:
        paymentRaw.provider === "live" || paymentRaw.provider === "demo"
          ? paymentRaw.provider
          : defaults.payment.provider,
    },
    seo: { keywords: keywords.length > 0 ? keywords : [...defaults.seo.keywords] },
    about: mergeAbout(row.about, defaults.about),
    homeCollection: mergeHomeCollection(row.homeCollection, defaults.homeCollection),
  };
}

export function toResolvedSiteConfig(cms: CmsSiteSettings): ResolvedSiteConfig {
  return {
    name: cms.branding.name,
    shortName: cms.branding.shortName,
    tagline: cms.branding.tagline,
    description: cms.branding.description,
    logo: cms.branding.logo,
    theme: cms.branding.theme,
    contact: {
      phones: cms.contact.phones,
      whatsapp: cms.contact.whatsapp,
      email: cms.contact.email,
    },
    hours: cms.contact.hours,
    social: cms.contact.social,
    // Branches stay on static siteConfig for chrome fallback; pages prefer DB branches.
    branches: siteConfig.branches,
    features: cms.features,
    payment: cms.payment,
    seo: cms.seo,
    about: cms.about,
    homeCollection: cms.homeCollection,
  };
}
