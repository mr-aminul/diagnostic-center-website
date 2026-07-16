import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
} from "@/lib/session-token";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Use in Server Components/actions that require a logged-in staff user. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Use in actions that require an ADMIN (not just STAFF/TECHNICIAN). */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/admin");
  return session;
}

export async function verifyCredentials(phone: string, password: string) {
  const user = await db.staffUser.findUnique({ where: { phone } });
  if (!user || !user.isActive) return null;
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

export async function createSessionCookie(user: {
  id: string;
  role: SessionPayload["role"];
  name: string;
}): Promise<void> {
  const token = await createSessionToken({ userId: user.id, role: user.role, name: user.name });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
