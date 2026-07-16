import { db } from "@/lib/db";
import { PackagesManager } from "@/components/admin/packages-manager";

export default async function AdminPackagesPage() {
  const [packages, tests] = await Promise.all([
    db.package.findMany({
      include: { tests: { include: { test: true } } },
      orderBy: { name: "asc" },
    }),
    db.test.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const plainPackages = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    nameBn: pkg.nameBn,
    description: pkg.description,
    descriptionBn: pkg.descriptionBn,
    imageUrl: pkg.imageUrl,
    price: Number(pkg.price),
    originalPrice: pkg.originalPrice == null ? null : Number(pkg.originalPrice),
    isActive: pkg.isActive,
    tests: pkg.tests.map(({ test }) => ({
      test: { id: test.id, name: test.name },
    })),
  }));

  return (
    <PackagesManager
      packages={plainPackages}
      testOptions={tests.map((test) => ({ id: test.id, name: test.name }))}
    />
  );
}
