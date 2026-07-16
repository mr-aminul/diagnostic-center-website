"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export interface ChangePasswordState {
  status: "idle" | "success" | "error";
  error?: string;
}

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await db.staffUser.findUnique({ where: { id: session.userId } });
  if (!user) return { status: "error", error: "User not found." };

  const isCurrentPasswordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return { status: "error", error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.staffUser.update({ where: { id: user.id }, data: { passwordHash } });

  return { status: "success" };
}
