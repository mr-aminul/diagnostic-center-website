import { db } from "@/lib/db";
import { TestsManager } from "@/components/admin/tests-manager";

export default async function AdminTestsPage() {
  const [tests, categories] = await Promise.all([
    db.test.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    db.testCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const plainTests = tests.map((test) => ({
    id: test.id,
    name: test.name,
    nameBn: test.nameBn,
    price: Number(test.price),
    sampleType: test.sampleType,
    preparation: test.preparation,
    preparationBn: test.preparationBn,
    turnaroundTime: test.turnaroundTime,
    isActive: test.isActive,
    categoryId: test.categoryId,
    category: { id: test.category.id, name: test.category.name },
  }));

  const plainCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    nameBn: category.nameBn,
  }));

  return <TestsManager tests={plainTests} categories={plainCategories} />;
}
