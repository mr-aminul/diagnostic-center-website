"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(1000),
});

export interface ContactFormState {
  status: "idle" | "success" | "error";
}

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const { name, phone, email, message } = parsed.data;
  const site = await getResolvedSiteConfig();
  const emailOrNull = email || null;

  await db.contactInquiry.create({
    data: { name, phone, email: emailOrNull, message },
  });

  const contactLine = emailOrNull ? `${phone}, ${emailOrNull}` : phone;
  await sendSms(
    site.contact.phones[0],
    `New website inquiry from ${name} (${contactLine}): ${message.slice(0, 120)}`
  );

  return { status: "success" };
}
