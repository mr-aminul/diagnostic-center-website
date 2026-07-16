/**
 * SMS is sent through a small provider interface so a new center can swap
 * gateways (BulkSMSBD, SSL Wireless, Alpha SMS, ...) by adding one class
 * below and pointing SMS_PROVIDER at it — nothing else in the app changes.
 */
interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/** Default in development: logs instead of sending, so no gateway account is needed to run locally. */
class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[sms:console] to=${to} message="${message}"`);
  }
}

/**
 * Generic HTTP GET gateway used by many Bangladeshi SMS resellers
 * (e.g. BulkSMSBD): GET {SMS_API_URL}?api_key=...&senderid=...&number=...&message=...
 * If your gateway uses different field names or a POST body, copy this
 * class and adjust — the rest of the app only depends on `SmsProvider`.
 */
class HttpGetSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "SMS_API_URL and SMS_API_KEY must be set when SMS_PROVIDER=http."
      );
    }

    const url = new URL(apiUrl);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("type", "text");
    url.searchParams.set("number", normalizeBangladeshiPhone(to));
    url.searchParams.set("message", message);
    if (senderId) url.searchParams.set("senderid", senderId);

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      throw new Error(`SMS gateway responded with ${response.status}`);
    }
  }
}

function normalizeBangladeshiPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return digits;
}

function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER ?? "console";
  switch (provider) {
    case "http":
      return new HttpGetSmsProvider();
    case "console":
    default:
      return new ConsoleSmsProvider();
  }
}

export async function sendSms(to: string, message: string): Promise<void> {
  try {
    await getSmsProvider().send(to, message);
  } catch (error) {
    // Never let a notification failure break a booking — log and move on.
    console.error("Failed to send SMS", { to, error });
  }
}
