"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { optionalText } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const doctorSchema = z.object({
  name: z.string().trim().min(1).max(150),
  nameBn: optionalText(150),
  specialty: z.string().trim().min(1).max(150),
  specialtyBn: optionalText(150),
  degrees: optionalText(200),
  schedule: optionalText(200),
  scheduleBn: optionalText(200),
});

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function createDoctor(
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = doctorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.doctor.create({ data: parsed.data });
  revalidatePath("/admin/doctors");
  return { status: "success" };
}

export async function updateDoctor(
  id: string,
  _previousState: EntityFormState,
  formData: FormData
): Promise<EntityFormState> {
  await requireSession();
  const parsed = doctorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.doctor.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/doctors");
  return { status: "success" };
}

export async function deleteDoctor(id: string): Promise<{ error?: string }> {
  await requireSession();
  await db.doctor.delete({ where: { id } }).catch(() =>
    db.doctor.update({ where: { id }, data: { isActive: false } })
  );
  revalidatePath("/admin/doctors");
  return {};
}
