/**
 * Optional email notifications. When SMTP is not configured the message is
 * logged so local development and SMS-only centers still work.
 */
interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  if (!host || !from) {
    console.log(
      `[email:console] to=${message.to} subject="${message.subject}" body="${message.text}"`
    );
    return;
  }

  // Centers can plug a real transporter (nodemailer, Resend, etc.) here.
  // Until then we log so misconfigured SMTP never blocks bookings.
  console.log(
    `[email:stub] SMTP configured but no transporter installed yet — to=${message.to} subject="${message.subject}"`
  );
  console.log(message.text);
}
