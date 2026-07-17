"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { deliverEmail } from "@/lib/email";
import { deliverSms } from "@/lib/sms";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";

export type ReplyInquiryState = {
  status: "idle" | "success" | "error";
  error?: string;
  channel?: "email" | "sms";
};

const replySchema = z.object({
  inquiryId: z.string().min(1),
  channel: z.enum(["email", "sms"]),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1, "Reply message is required.").max(2000),
});

export async function markInquiryRead(id: string): Promise<{ error?: string }> {
  await requireSession();
  await db.contactInquiry.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/inquiries");
  return {};
}

export async function markInquiryUnread(id: string): Promise<{ error?: string }> {
  await requireSession();
  await db.contactInquiry.update({ where: { id }, data: { isRead: false } });
  revalidatePath("/admin/inquiries");
  return {};
}

export async function deleteInquiry(id: string): Promise<{ error?: string }> {
  await requireSession();
  await db.contactInquiry.delete({ where: { id } });
  revalidatePath("/admin/inquiries");
  return {};
}

export async function replyToInquiry(
  _previousState: ReplyInquiryState,
  formData: FormData
): Promise<ReplyInquiryState> {
  await requireSession();

  const parsed = replySchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    channel: formData.get("channel"),
    subject: formData.get("subject") || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid reply.",
    };
  }

  const { inquiryId, channel, body } = parsed.data;
  const inquiry = await db.contactInquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) {
    return { status: "error", error: "Inquiry not found." };
  }

  const site = await getResolvedSiteConfig();
  const centerName = site.shortName || site.name;

  try {
    if (channel === "email") {
      if (!inquiry.email) {
        return {
          status: "error",
          error: "This inquiry has no email address. Reply by SMS instead.",
        };
      }

      const subject =
        parsed.data.subject?.trim() ||
        `Re: Your inquiry to ${centerName}`;

      await deliverEmail({
        to: inquiry.email,
        subject,
        text: [
          body,
          "",
          "---",
          `Your original message:`,
          inquiry.message,
          "",
          `${centerName}`,
          site.contact.phones[0] ?? "",
        ]
          .filter(Boolean)
          .join("\n"),
        replyTo: site.contact.email || undefined,
      });

      await db.contactInquiry.update({
        where: { id: inquiryId },
        data: {
          isRead: true,
          repliedAt: new Date(),
          replyBody: body,
          replyChannel: "EMAIL",
        },
      });
    } else {
      const smsBody = `${centerName}: ${body}`.slice(0, 480);
      await deliverSms(inquiry.phone, smsBody);

      await db.contactInquiry.update({
        where: { id: inquiryId },
        data: {
          isRead: true,
          repliedAt: new Date(),
          replyBody: body,
          replyChannel: "SMS",
        },
      });
    }
  } catch (error) {
    console.error("Failed to reply to inquiry", { inquiryId, channel, error });
    return {
      status: "error",
      error:
        channel === "email"
          ? "Could not send email. Check SMTP settings or try SMS."
          : "Could not send SMS. Check the SMS gateway settings.",
    };
  }

  revalidatePath("/admin/inquiries");
  return { status: "success", channel };
}
