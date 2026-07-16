import type { Locale } from "@/config/site";
import type { SearchHit } from "@/lib/search/types";

export function localizedTitle(hit: SearchHit, locale: Locale) {
  return locale === "bn" && hit.titleBn ? hit.titleBn : hit.title;
}

export function localizedSubtitle(hit: SearchHit, locale: Locale) {
  if (locale === "bn" && hit.subtitleBn) return hit.subtitleBn;
  return hit.subtitle;
}

export function scoreSearchHit(hit: SearchHit, query: string, locale: Locale) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const title = localizedTitle(hit, locale).toLowerCase();
  const subtitle = (localizedSubtitle(hit, locale) ?? "").toLowerCase();

  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 75;
  if (subtitle.startsWith(q)) return 65;
  if (subtitle.includes(q)) return 55;
  if (hit.keywords.includes(q)) return 40;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (
    tokens.length > 1 &&
    tokens.every((token) => hit.keywords.includes(token) || title.includes(token))
  ) {
    return 50;
  }

  return 0;
}
