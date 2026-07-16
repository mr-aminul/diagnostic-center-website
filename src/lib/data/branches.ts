import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

async function queryBranches() {
  return db.branch.findMany({
    where: { isActive: true },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });
}

/** Dedupes within a request; caches across requests for a short window. */
export const getBranches = cache(async () =>
  unstable_cache(queryBranches, ["branches-active"], {
    revalidate: 60,
    tags: ["branches"],
  })(),
);
