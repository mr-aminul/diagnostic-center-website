"use server";

import { z } from "zod";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
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
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const { name, phone, message } = parsed.data;

  await sendSms(
    siteConfig.contact.phones[0],
    `New website inquiry from ${name} (${phone}): ${message.slice(0, 120)}`
  );

  return { status: "success" };
}
