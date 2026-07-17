import { createHash, randomInt, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { formatBdPhoneForStorage, lastDigits } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { isDevOtpBypassEnabled } from "@/lib/dev-tools";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export function phoneKeyFromInput(phone: string): string | null {
  const normalized = formatBdPhoneForStorage(phone);
  if (normalized) return normalized;
  // Fallback for legacy stored numbers that still match by last digits.
  const key = lastDigits(phone, 11);
  if (key.length < 10) return null;
  return key;
}

function hashOtp(phoneKey: string, code: string): string {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET}:${phoneKey}:${code}`)
    .digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function issuePhoneOtp(phone: string): Promise<
  { ok: true } | { ok: false; error: "invalid_phone" | "cooldown" | "no_bookings" }
> {
  const phoneKey = phoneKeyFromInput(phone);
  if (!phoneKey) return { ok: false, error: "invalid_phone" };

  const bookings = await db.booking.findMany({
    where: { phone: { contains: phoneKey.slice(-10) } },
    select: { id: true },
    take: 1,
  });

  // Production / strict local: refuse numbers with zero history.
  // Dev OTP bypass: still allow the flow so any phone can be tested.
  if (bookings.length === 0 && !isDevOtpBypassEnabled()) {
    return { ok: false, error: "no_bookings" };
  }

  if (!isDevOtpBypassEnabled()) {
    const latest = await db.phoneOtp.findFirst({
      where: { phoneKey },
      orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      return { ok: false, error: "cooldown" };
    }
  }

  await db.phoneOtp.deleteMany({ where: { phoneKey } });

  // Real OTP is still generated + SMS'd so console SMS works in logs,
  // but verifyPhoneOtp accepts any code while isDevOtpBypassEnabled().
  const code = String(randomInt(100000, 999999));
  await db.phoneOtp.create({
    data: {
      phoneKey,
      codeHash: hashOtp(phoneKey, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  if (isDevOtpBypassEnabled()) {
    console.log(
      `[otp:dev-bypass] phone=${phone} realCode=${code} (any OTP also accepted — set DEV_OTP_BYPASS=false to enforce)`
    );
  }

  await sendSms(
    phone,
    `${siteConfig.shortName} verification code: ${code}. Use it to open your reports. Valid 10 minutes.`
  );

  return { ok: true };
}

export async function verifyPhoneOtp(
  phone: string,
  code: string
): Promise<{ ok: true; phoneKey: string } | { ok: false; error: "invalid" | "expired" | "locked" }> {
  const phoneKey = phoneKeyFromInput(phone);
  if (!phoneKey) return { ok: false, error: "invalid" };

  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "invalid" };

  /**
   * DEV PLACEHOLDER — accept any non-empty OTP while developing.
   * Hard-disabled when NODE_ENV=production.
   * Turn off locally with DEV_OTP_BYPASS=false to test real OTP matching.
   */
  if (isDevOtpBypassEnabled()) {
    await db.phoneOtp.deleteMany({ where: { phoneKey } });
    return { ok: true, phoneKey };
  }

  const otp = await db.phoneOtp.findFirst({
    where: { phoneKey },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, error: "invalid" };
  if (otp.expiresAt.getTime() < Date.now()) {
    await db.phoneOtp.deleteMany({ where: { phoneKey } });
    return { ok: false, error: "expired" };
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "locked" };
  }

  const match = safeEqualHex(otp.codeHash, hashOtp(phoneKey, trimmed));
  if (!match) {
    await db.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "invalid" };
  }

  await db.phoneOtp.deleteMany({ where: { phoneKey } });
  return { ok: true, phoneKey };
}
