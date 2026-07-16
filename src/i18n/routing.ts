import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bn", "en"],
  defaultLocale: "bn",
  localePrefix: "as-needed",
  // Always serve Bangla for `/` unless the visitor explicitly chose English
  // (URL prefix `/en` or language switcher). Ignore browser Accept-Language.
  localeDetection: false,
});
