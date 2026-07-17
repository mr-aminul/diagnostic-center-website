"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { optionalText } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const testimonialSchema = z.object({
  nameEn: z.string().trim().min(1).max(120),
  nameBn: optionalText(120),
  roleEn: z.string().trim().min(1).max(120),
  roleBn: optionalText(120),
  quoteEn: z.string().trim().min(1).max(1000),
  quoteBn: optionalText(1000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

function revalidateTestimonials() {
  updateTag("testimonials");
  revalidatePath("/admin/content/testimonials");
  revalidatePath("/");
}

export async function createTestimonial(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const parsed = testimonialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.testimonial.create({ data: parsed.data });
  revalidateTestimonials();
  return { status: "success" };
}

export async function updateTestimonial(
  id: string,
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const parsed = testimonialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.testimonial.update({ where: { id }, data: parsed.data });
  revalidateTestimonials();
  return { status: "success" };
}

export async function deleteTestimonial(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  await db.testimonial.delete({ where: { id } });
  revalidateTestimonials();
  return {};
}
