/**
 * Single source of truth for everything that changes from one diagnostic
 * center to the next: branding, contact details, branches, and feature
 * flags. To launch a new center, fork this repo and edit this file (plus
 * .env) — no other code should need to change. See NEW_CENTER_SETUP.md.
 */

export type Locale = "en" | "bn";

export type LocalizedText = Record<Locale, string>;

export interface Branch {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  phone: string;
  whatsapp?: string;
  mapEmbedUrl?: string;
  isMain: boolean;
}

export interface SiteConfig {
  /** Full legal/brand name shown in the header, footer, and page titles. */
  name: string;
  /** Short name used where space is tight (mobile nav, favicon alt text). */
  shortName: string;
  tagline: LocalizedText;
  description: LocalizedText;
  logo: {
    src: string;
    icon: string;
  };
  theme: {
    /** Hex color. Drives buttons, links, and highlighted UI. */
    primary: string;
    /** Hex color. Used for secondary buttons and section backgrounds. */
    secondary: string;
    /** Hex color. Used for small accents (badges, active nav items). */
    accent: string;
    /** Base border radius, e.g. "0.625rem". */
    radius: string;
  };
  contact: {
    phones: string[];
    whatsapp: string;
    email: string;
  };
  hours: LocalizedText;
  social: {
    facebook?: string;
    youtube?: string;
    linkedin?: string;
  };
  branches: Branch[];
  features: {
    homeCollection: boolean;
    multiBranch: boolean;
    onlinePayment: boolean;
    testimonials: boolean;
    doctorsPage: boolean;
  };
  /**
   * Online payment wiring. Keep `provider: "demo"` until a real gateway is
   * connected — the site will show a realistic dummy checkout UI.
   * Switch to `"live"` once `createCheckoutSession` is implemented for your gateway.
   */
  payment: {
    provider: "demo" | "live";
  };
  seo: {
    keywords: string[];
  };
}

export const siteConfig: SiteConfig = {
  name: "Health Point Diagnostic Center",
  shortName: "Health Point",
  tagline: {
    en: "Accurate diagnostics, compassionate care",
    bn: "নির্ভুল ডায়াগনস্টিক, আন্তরিক সেবা",
  },
  description: {
    en: "A modern diagnostic center offering pathology, imaging, and health checkup packages with home sample collection across the city.",
    bn: "প্যাথলজি, ইমেজিং এবং হেলথ চেকআপ প্যাকেজ সহ একটি আধুনিক ডায়াগনস্টিক সেন্টার, শহরজুড়ে হোম স্যাম্পল কালেকশন সুবিধা সহ।",
  },
  logo: {
    src: "/logo.svg",
    icon: "/favicon.ico",
  },
  theme: {
    primary: "#047857",
    secondary: "#ecfdf5",
    accent: "#059669",
    radius: "0.625rem",
  },
  contact: {
    phones: ["+880 1700-000000", "+880 2-9000000"],
    whatsapp: "+8801700000000",
    email: "info@example.com",
  },
  hours: {
    en: "Every day, 7:00 AM – 10:00 PM",
    bn: "প্রতিদিন সকাল ৭টা - রাত ১০টা",
  },
  social: {
    facebook: "https://facebook.com/",
    youtube: undefined,
    linkedin: undefined,
  },
  branches: [
    {
      id: "main",
      name: { en: "Main Branch — Dhanmondi", bn: "মূল শাখা — ধানমন্ডি" },
      address: {
        en: "House 12, Road 5, Dhanmondi, Dhaka 1205",
        bn: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫",
      },
      phone: "+880 1700-000000",
      whatsapp: "+8801700000000",
      mapEmbedUrl: "https://www.google.com/maps?q=Dhanmondi,Dhaka&output=embed",
      isMain: true,
    },
  ],
  features: {
    homeCollection: true,
    multiBranch: false,
    onlinePayment: true,
    testimonials: true,
    doctorsPage: true,
  },
  payment: {
    provider: "demo",
  },
  seo: {
    keywords: [
      "diagnostic center",
      "pathology lab",
      "health checkup",
      "home sample collection",
      "Dhaka",
      "Bangladesh",
    ],
  },
};
