import { jwtVerify, SignJWT } from "jose";

const REPORT_TOKEN_TTL_SECONDS = 60 * 30; // 30 minutes after a successful track

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add a long random string to your .env file.");
  }
  return new TextEncoder().encode(secret);
}

export async function createReportDownloadToken(input: {
  referenceCode: string;
  bookingId: string;
  bookingItemId: string;
}): Promise<string> {
  return new SignJWT({
    purpose: "report-download",
    referenceCode: input.referenceCode,
    bookingId: input.bookingId,
    bookingItemId: input.bookingItemId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REPORT_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyReportDownloadToken(
  token: string
): Promise<{
  referenceCode: string;
  bookingId: string;
  bookingItemId: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.purpose === "report-download" &&
      typeof payload.referenceCode === "string" &&
      typeof payload.bookingId === "string" &&
      typeof payload.bookingItemId === "string"
    ) {
      return {
        referenceCode: payload.referenceCode,
        bookingId: payload.bookingId,
        bookingItemId: payload.bookingItemId,
      };
    }
    return null;
  } catch {
    return null;
  }
}
