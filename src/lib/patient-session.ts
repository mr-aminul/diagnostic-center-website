import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export interface PatientSessionPayload {
  phoneKey: string;
  phoneDisplay: string;
}

const PATIENT_SESSION_DURATION_SECONDS = 60 * 60 * 2; // 2 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add a long random string to your .env file.");
  }
  return new TextEncoder().encode(secret);
}

export async function createPatientSessionToken(
  payload: PatientSessionPayload
): Promise<string> {
  return new SignJWT({
    purpose: "patient-portal",
    phoneKey: payload.phoneKey,
    phoneDisplay: payload.phoneDisplay,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PATIENT_SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyPatientSessionToken(
  token: string
): Promise<PatientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.purpose === "patient-portal" &&
      typeof payload.phoneKey === "string" &&
      typeof payload.phoneDisplay === "string"
    ) {
      return {
        phoneKey: payload.phoneKey,
        phoneDisplay: payload.phoneDisplay,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const PATIENT_COOKIE_NAME = "patient_portal";
export const PATIENT_SESSION_MAX_AGE_SECONDS = PATIENT_SESSION_DURATION_SECONDS;

export async function getPatientSession(): Promise<PatientSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PATIENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPatientSessionToken(token);
}

export async function setPatientSessionCookie(
  payload: PatientSessionPayload
): Promise<void> {
  const token = await createPatientSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(PATIENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PATIENT_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearPatientSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PATIENT_COOKIE_NAME);
}
