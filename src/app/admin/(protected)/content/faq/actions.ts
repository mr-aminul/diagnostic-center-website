"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { optionalText } from "@/lib/zod-helpers";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const faqSchema = z.object({
  questionEn: z.string().trim().min(1).max(300),
  questionBn: optionalText(300),
  answerEn: z.string().trim().min(1).max(2000),
  answerBn: optionalText(2000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

function revalidateFaq() {
  updateTag("faq");
  revalidatePath("/admin/content/faq");
  revalidatePath("/faq");
}

export async function createFaqItem(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.faqItem.create({ data: parsed.data });
  revalidateFaq();
  return { status: "success" };
}

export async function updateFaqItem(
  id: string,
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  await db.faqItem.update({ where: { id }, data: parsed.data });
  revalidateFaq();
  return { status: "success" };
}

export async function deleteFaqItem(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  await db.faqItem.delete({ where: { id } });
  revalidateFaq();
  return {};
}
