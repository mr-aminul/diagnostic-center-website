"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { optionalText } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const branchSchema = z.object({
  name: z.string().trim().min(1).max(150),
  nameBn: optionalText(150),
  address: z.string().trim().min(1).max(300),
  addressBn: optionalText(300),
  phone: z.string().trim().min(6).max(30),
  mapUrl: optionalText(500),
  isMain: z.boolean().default(false),
});

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

async function ensureSingleMain(newMainId: string | null) {
  if (!newMainId) return;
  await db.branch.updateMany({
    where: { id: { not: newMainId } },
    data: { isMain: false },
  });
}

export async function createBranch(
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = branchSchema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn"),
    address: formData.get("address"),
    addressBn: formData.get("addressBn"),
    phone: formData.get("phone"),
    mapUrl: formData.get("mapUrl"),
    isMain: formData.get("isMain") === "on",
  });
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  const branch = await db.branch.create({ data: parsed.data });
  if (parsed.data.isMain) await ensureSingleMain(branch.id);

  revalidatePath("/admin/branches");
  revalidatePath("/");
  return { status: "success" };
}

export async function updateBranch(
  id: string,
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = branchSchema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn"),
    address: formData.get("address"),
    addressBn: formData.get("addressBn"),
    phone: formData.get("phone"),
    mapUrl: formData.get("mapUrl"),
    isMain: formData.get("isMain") === "on",
  });
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.branch.update({ where: { id }, data: parsed.data });
  if (parsed.data.isMain) await ensureSingleMain(id);

  revalidatePath("/admin/branches");
  revalidatePath("/");
  return { status: "success" };
}

export async function deleteBranch(id: string): Promise<{ error?: string }> {
  await requireSession();
  const bookingCount = await db.booking.count({ where: { branchId: id } });
  if (bookingCount > 0) {
    await db.branch.update({ where: { id }, data: { isActive: false } });
  } else {
    await db.branch.delete({ where: { id } });
  }
  revalidatePath("/admin/branches");
  revalidatePath("/");
  return {};
}
