import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportStorage } from "@/lib/storage";
import { lastDigits } from "@/lib/phone";
import { verifyReportDownloadToken } from "@/lib/report-token";
import { getPatientSession } from "@/lib/patient-session";
import { getSession } from "@/lib/auth";

type ReportFile = { storageKey: string; fileName: string };

/**
 * Report download auth (any one is enough):
 * 1. Short-lived signed token from an authenticated Track session
 * 2. Active admin/staff session + bookingId + itemId
 * 3. Active patient OTP session + bookingId + itemId owned by that phone
 * 4. Legacy reference + phone pair (staff/support links) + itemId
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const bookingId = request.nextUrl.searchParams.get("bookingId")?.trim();
  const itemId = request.nextUrl.searchParams.get("itemId")?.trim();
  const referenceCode = request.nextUrl.searchParams.get("ref")?.trim().toUpperCase();
  const phone = request.nextUrl.searchParams.get("phone")?.trim();
  const inline = request.nextUrl.searchParams.get("inline") === "1";

  let report: ReportFile | null = null;

  if (token) {
    const verified = await verifyReportDownloadToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "Download link expired. Open Track again to get a new one." },
        { status: 401 },
      );
    }
    const row = await db.report.findFirst({
      where: {
        bookingItemId: verified.bookingItemId,
        bookingId: verified.bookingId,
        booking: { referenceCode: verified.referenceCode },
      },
      select: { storageKey: true, fileName: true },
    });
    report = row;
  } else if (bookingId && itemId) {
    const adminSession = await getSession();
    if (adminSession) {
      const row = await db.report.findFirst({
        where: { bookingId, bookingItemId: itemId },
        select: { storageKey: true, fileName: true },
      });
      report = row;
    } else {
      const session = await getPatientSession();
      if (!session) {
        return NextResponse.json(
          { error: "Please verify your phone to download." },
          { status: 401 },
        );
      }
      const row = await db.report.findFirst({
        where: {
          bookingId,
          bookingItemId: itemId,
          booking: { phone: { contains: session.phoneKey.slice(-10) } },
        },
        select: { storageKey: true, fileName: true },
      });
      report = row;
    }
  } else {
    if (!referenceCode || !phone || !itemId) {
      return NextResponse.json(
        { error: "Missing download credentials." },
        { status: 400 },
      );
    }

    const phoneSuffix = lastDigits(phone);
    if (phoneSuffix.length < 6) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    const row = await db.report.findFirst({
      where: {
        bookingItemId: itemId,
        booking: {
          referenceCode,
          phone: { contains: phoneSuffix },
        },
      },
      select: { storageKey: true, fileName: true },
    });
    report = row;
  }

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const fileBuffer = await reportStorage.read(report.storageKey);
  const disposition = inline ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${report.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
