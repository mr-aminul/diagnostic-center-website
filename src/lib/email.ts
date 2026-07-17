import nodemailer from "nodemailer";

/**
 * Optional email notifications. When SMTP is not configured the message is
 * logged so local development and SMS-only centers still work.
 */
interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export function isEmailConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  return Boolean(host && from);
}

/**
 * Soft send used by booking flows — never throws.
 * Returns "sent" when SMTP delivered, "logged" when falling back to console.
 */
export async function sendEmail(message: EmailMessage): Promise<"sent" | "logged"> {
  try {
    return await deliverEmail(message);
  } catch (error) {
    console.error("Failed to send email", { to: message.to, error });
    return "logged";
  }
}

/**
 * Strict send for admin actions — throws when delivery fails.
 * Still logs to console (and succeeds) when SMTP is not configured.
 */
export async function deliverEmail(message: EmailMessage): Promise<"sent" | "logged"> {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  if (!host || !from) {
    console.log(
      `[email:console] to=${message.to} subject="${message.subject}" body="${message.text}"`
    );
    return "logged";
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    replyTo: message.replyTo,
  });

  return "sent";
}
