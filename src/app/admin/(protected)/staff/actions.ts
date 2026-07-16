"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/auth";
import { lastDigits } from "@/lib/phone";

export interface StaffActionState {
  status: "idle" | "success" | "error";
  error?: string;
}

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF", "TECHNICIAN"]),
  password: z.string().min(8).max(72),
});

export async function inviteStaff(
  _previousState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", error: "Check the form fields and try again." };
  }

  if (lastDigits(parsed.data.phone).length < 10) {
    return { status: "error", error: "Enter a valid phone number." };
  }

  const existing = await db.staffUser.findUnique({ where: { phone: parsed.data.phone } });
  if (existing) {
    return { status: "error", error: "A staff user with this phone already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.staffUser.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/admin/staff");
  return { status: "success" };
}

export async function setStaffActive(
  staffId: string,
  isActive: boolean
): Promise<StaffActionState> {
  const session = await requireAdmin();
  if (session.userId === staffId && !isActive) {
    return { status: "error", error: "You cannot deactivate your own account." };
  }

  await db.staffUser.update({
    where: { id: staffId },
    data: { isActive },
  });

  revalidatePath("/admin/staff");
  return { status: "success" };
}

export async function resetStaffPassword(
  _previousState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  await requireAdmin();

  const staffId = String(formData.get("staffId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!staffId || password.length < 8) {
    return { status: "error", error: "Password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.staffUser.update({
    where: { id: staffId },
    data: { passwordHash },
  });

  revalidatePath("/admin/staff");
  return { status: "success" };
}

/** TECHNICIAN can view bookings/reports but not edit catalog — enforced in actions. */
export async function requireCatalogEditor() {
  const session = await requireSession();
  if (session.role === "TECHNICIAN") {
    throw new Error("Technicians cannot edit the catalog.");
  }
  return session;
}
