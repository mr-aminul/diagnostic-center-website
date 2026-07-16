"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionCookie, verifyCredentials } from "@/lib/auth";

const loginSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export interface LoginFormState {
  status: "idle" | "error";
}

export async function login(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const user = await verifyCredentials(parsed.data.phone, parsed.data.password);
  if (!user) {
    return { status: "error" };
  }

  await createSessionCookie({ id: user.id, role: user.role, name: user.name });

  const destination =
    parsed.data.next && parsed.data.next.startsWith("/admin") ? parsed.data.next : "/admin";
  redirect(destination);
}
