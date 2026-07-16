import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

async function queryTestCategories() {
  return db.testCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

async function queryTests() {
  return db.test.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
}

async function queryPackages() {
  return db.package.findMany({
    where: { isActive: true },
    include: { tests: { include: { test: true } } },
    orderBy: { price: "asc" },
  });
}

export const getTestCategories = cache(async () =>
  unstable_cache(queryTestCategories, ["test-categories"], {
    revalidate: 60,
    tags: ["catalog"],
  })(),
);

export const getTests = cache(async () =>
  unstable_cache(queryTests, ["tests-active"], {
    revalidate: 60,
    tags: ["catalog"],
  })(),
);

export const getPackages = cache(async () =>
  unstable_cache(queryPackages, ["packages-active"], {
    revalidate: 60,
    tags: ["catalog"],
  })(),
);

export const getPackageById = cache(async (id: string) =>
  db.package.findUnique({
    where: { id },
    include: { tests: { include: { test: true } } },
  }),
);

export type TestWithCategory = Awaited<ReturnType<typeof getTests>>[number];
export type PackageWithTests = Awaited<ReturnType<typeof getPackages>>[number];
