import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Builds per-page <title>/<meta description> from the same translation keys
 * already used to render the page's own heading and subtitle, so every
 * public page gets locale-correct SEO metadata without duplicating copy.
 * Combines with the `%s | shortName` title template set in
 * app/[locale]/layout.tsx.
 */
export async function buildPageMetadata(options: {
  titleKey: string;
  descriptionKey?: string;
}): Promise<Metadata> {
  const t = await getTranslations();
  const title = t(options.titleKey);
  const description = options.descriptionKey ? t(options.descriptionKey) : undefined;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}
