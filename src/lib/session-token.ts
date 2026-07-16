import { jwtVerify, SignJWT } from "jose";

export interface SessionPayload {
  userId: string;
  role: "ADMIN" | "STAFF" | "TECHNICIAN";
  name: string;
}

const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hour shifts

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add a long random string to your .env file."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        userId: payload.userId,
        role: payload.role as SessionPayload["role"],
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_SECONDS;
