import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getPackages, getTestCategories, getTests } from "@/lib/data/catalog";
import { getBranches } from "@/lib/data/branches";
import { getDoctors } from "@/lib/data/doctors";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { buildSearchIndex } from "@/lib/search/build-search-index";

const getCachedSearchIndex = unstable_cache(
  async () => {
    const site = await getResolvedSiteConfig();
    const [packages, doctors, categories, tests, branches] = await Promise.all([
      getPackages(),
      site.features.doctorsPage ? getDoctors() : Promise.resolve([]),
      getTestCategories(),
      getTests(),
      getBranches(),
    ]);

    return buildSearchIndex({
      tests,
      packages,
      doctors,
      categories,
      branches,
      site,
    });
  },
  ["search-index"],
  { revalidate: 60, tags: ["catalog", "doctors", "branches", "site-settings"] },
);

export async function GET() {
  const items = await getCachedSearchIndex();
  return NextResponse.json({ items });
}
