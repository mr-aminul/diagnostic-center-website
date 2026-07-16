"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCatalogEditor } from "@/app/admin/(protected)/staff/actions";
import { optionalText } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const testSchema = z.object({
  name: z.string().trim().min(1).max(200),
  nameBn: optionalText(200),
  categoryId: z.string().min(1, "Please choose a category."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  sampleType: optionalText(100),
  preparation: optionalText(500),
  preparationBn: optionalText(500),
  turnaroundTime: optionalText(100),
});

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function createTest(
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  try {
    await requireCatalogEditor();
  } catch {
    return { status: "error", error: "Technicians cannot edit the catalog." };
  }
  const parsed = testSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.test.create({ data: parsed.data });
  revalidatePath("/admin/tests");
  return { status: "success" };
}

export async function updateTest(
  id: string,
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  try {
    await requireCatalogEditor();
  } catch {
    return { status: "error", error: "Technicians cannot edit the catalog." };
  }
  const parsed = testSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.test.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/tests");
  return { status: "success" };
}

export async function deleteTest(id: string): Promise<{ error?: string }> {
  try {
    await requireCatalogEditor();
  } catch {
    return { error: "Technicians cannot edit the catalog." };
  }
  try {
    await db.test.delete({ where: { id } });
  } catch {
    // Test is referenced by a package or a past booking — deactivate instead of a hard delete.
    await db.test.update({ where: { id }, data: { isActive: false } });
  }
  revalidatePath("/admin/tests");
  return {};
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(100),
  nameBn: optionalText(100),
});

export async function createCategory(
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  try {
    await requireCatalogEditor();
  } catch {
    return { status: "error", error: "Technicians cannot edit the catalog." };
  }
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  const count = await db.testCategory.count();
  await db.testCategory.create({ data: { ...parsed.data, sortOrder: count } });
  revalidatePath("/admin/tests");
  return { status: "success" };
}
