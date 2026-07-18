import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { AdminSearchHit } from "@/lib/admin-search";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ hits: [] satisfies AdminSearchHit[] });
  }

  const [bookings, appointments, inquiries] = await Promise.all([
    db.booking.findMany({
      where: {
        OR: [
          { referenceCode: { contains: q, mode: "insensitive" } },
          { patientName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        referenceCode: true,
        patientName: true,
        phone: true,
        status: true,
      },
    }),
    db.doctorAppointment.findMany({
      where: {
        OR: [
          { patientName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        patientName: true,
        phone: true,
        status: true,
        doctor: { select: { name: true } },
      },
    }),
    db.contactInquiry.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        phone: true,
        isRead: true,
      },
    }),
  ]);

  const hits: AdminSearchHit[] = [
    ...bookings.map((booking) => ({
      id: booking.id,
      kind: "booking" as const,
      title: booking.referenceCode,
      subtitle: `${booking.patientName} · ${booking.phone} · ${booking.status}`,
      href: `/admin/bookings/${booking.id}`,
    })),
    ...appointments.map((appointment) => ({
      id: appointment.id,
      kind: "appointment" as const,
      title: appointment.patientName,
      subtitle: `${appointment.doctor.name} · ${appointment.phone} · ${appointment.status}`,
      href: `/admin/appointments`,
    })),
    ...inquiries.map((inquiry) => ({
      id: inquiry.id,
      kind: "inquiry" as const,
      title: inquiry.name,
      subtitle: `${inquiry.phone}${inquiry.isRead ? "" : " · Unread"}`,
      href: `/admin/inquiries`,
    })),
  ];

  return NextResponse.json({ hits });
}
