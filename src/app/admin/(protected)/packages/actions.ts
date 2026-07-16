"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { optionalNonNegativeNumber, optionalText, optionalUrl } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const packageSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    nameBn: optionalText(200),
    description: optionalText(500),
    descriptionBn: optionalText(500),
    imageUrl: optionalUrl(),
    price: z.coerce.number().min(0, "Price cannot be negative."),
    originalPrice: optionalNonNegativeNumber(),
    testIds: z.array(z.string()).min(1, "Select at least one test."),
  })
  .refine(
    (data) => data.originalPrice == null || data.originalPrice > data.price,
    {
      message: "Original price must be higher than the sale price.",
      path: ["originalPrice"],
    },
  );

function parsePackageForm(formData: FormData) {
  return packageSchema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn"),
    description: formData.get("description"),
    descriptionBn: formData.get("descriptionBn"),
    imageUrl: formData.get("imageUrl"),
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
    testIds: formData.getAll("testIds"),
  });
}

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function createPackage(
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = parsePackageForm(formData);
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  const { testIds, ...data } = parsed.data;
  await db.package.create({
    data: { ...data, tests: { create: testIds.map((testId) => ({ testId })) } },
  });
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/packages");
  return { status: "success" };
}

export async function updatePackage(
  id: string,
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = parsePackageForm(formData);
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  const { testIds, ...data } = parsed.data;
  await db.package.update({
    where: { id },
    data: {
      ...data,
      tests: { deleteMany: {}, create: testIds.map((testId) => ({ testId })) },
    },
  });
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/packages");
  return { status: "success" };
}

export async function deletePackage(id: string): Promise<{ error?: string }> {
  await requireSession();
  try {
    await db.package.delete({ where: { id } });
  } catch {
    await db.package.update({ where: { id }, data: { isActive: false } });
  }
  revalidatePath("/admin/packages");
  return {};
}
