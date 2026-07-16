import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getPackages, getTestCategories, getTests } from "@/lib/data/catalog";
import { getBranches } from "@/lib/data/branches";
import { getDoctors } from "@/lib/data/doctors";
import { buildSearchIndex } from "@/lib/search/build-search-index";
import { siteConfig } from "@/config/site";

const getCachedSearchIndex = unstable_cache(
  async () => {
    const [packages, doctors, categories, tests, branches] = await Promise.all([
      getPackages(),
      siteConfig.features.doctorsPage ? getDoctors() : Promise.resolve([]),
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
    });
  },
  ["search-index"],
  { revalidate: 60, tags: ["catalog", "doctors", "branches"] },
);

export async function GET() {
  const items = await getCachedSearchIndex();
  return NextResponse.json({ items });
}
