import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { formatBdPhoneForStorage, lastDigits } from "@/lib/phone";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
} from "@/lib/session-token";

/** Resolve a staff row by local 01… number or legacy +880… storage. */
async function findStaffUserByPhone(phone: string) {
  const normalized = formatBdPhoneForStorage(phone);
  if (normalized) {
    const byCanonical = await db.staffUser.findUnique({ where: { phone: normalized } });
    if (byCanonical) return byCanonical;
  }

  const byExact = await db.staffUser.findUnique({ where: { phone } });
  if (byExact) return byExact;

  const suffix = lastDigits(phone, 10);
  if (suffix.length < 10) return null;

  const candidates = await db.staffUser.findMany({
    where: { phone: { contains: suffix } },
    take: 10,
  });
  return candidates.find((user) => lastDigits(user.phone, 10) === suffix) ?? null;
}

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
  const user = await findStaffUserByPhone(phone);
  if (!user || !user.isActive) return null;
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

/** Re-verify the currently logged-in staff user's password (e.g. before cancel). */
export async function verifySessionPassword(password: string): Promise<boolean> {
  const session = await getSession();
  if (!session || !password) return false;

  const user = await db.staffUser.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return false;

  return bcrypt.compare(password, user.passwordHash);
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
