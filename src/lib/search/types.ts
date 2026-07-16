export type SearchCategory =
  | "test"
  | "package"
  | "doctor"
  | "category"
  | "page"
  | "contact"
  | "branch";

export type SearchHref =
  | { kind: "route"; pathname: string; query?: Record<string, string> }
  | { kind: "external"; url: string };

export type SearchHit = {
  id: string;
  category: SearchCategory;
  title: string;
  titleBn: string | null;
  subtitle: string | null;
  subtitleBn: string | null;
  /** Lowercased haystack for matching (both locales + aliases). */
  keywords: string;
  href: SearchHref;
  price: number | null;
};
