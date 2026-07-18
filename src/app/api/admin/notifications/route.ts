import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { AdminNotification } from "@/lib/admin-search";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = await db.contactInquiry.findMany({
    where: { isRead: false },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      phone: true,
      message: true,
      createdAt: true,
    },
  });

  const notifications: AdminNotification[] = inquiries.map((inquiry) => ({
    id: inquiry.id,
    title: `Inquiry from ${inquiry.name}`,
    body: inquiry.message.slice(0, 120),
    href: "/admin/inquiries",
    createdAt: inquiry.createdAt.toISOString(),
  }));

  return NextResponse.json({
    notifications,
    unreadCount: notifications.length,
  });
}
