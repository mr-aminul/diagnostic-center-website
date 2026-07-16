import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportStorage } from "@/lib/storage";
import { lastDigits } from "@/lib/phone";
import { verifyReportDownloadToken } from "@/lib/report-token";
import { getPatientSession } from "@/lib/patient-session";

/**
 * Report download auth (any one is enough):
 * 1. Short-lived signed token from an authenticated Track session
 * 2. Active patient OTP session + bookingId owned by that phone
 * 3. Legacy reference + phone pair (staff/support links)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const bookingId = request.nextUrl.searchParams.get("bookingId")?.trim();
  const referenceCode = request.nextUrl.searchParams.get("ref")?.trim().toUpperCase();
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  let booking:
    | {
        report: { storageKey: string; fileName: string } | null;
      }
    | null = null;

  if (token) {
    const verified = await verifyReportDownloadToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "Download link expired. Open Track again to get a new one." },
        { status: 401 }
      );
    }
    booking = await db.booking.findFirst({
      where: { id: verified.bookingId, referenceCode: verified.referenceCode },
      include: { report: true },
    });
  } else if (bookingId) {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: "Please verify your phone to download." }, { status: 401 });
    }
    booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        phone: { contains: session.phoneKey.slice(-10) },
      },
      include: { report: true },
    });
  } else {
    if (!referenceCode || !phone) {
      return NextResponse.json(
        { error: "Missing download credentials." },
        { status: 400 }
      );
    }

    const phoneSuffix = lastDigits(phone);
    if (phoneSuffix.length < 6) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    booking = await db.booking.findFirst({
      where: { referenceCode, phone: { contains: phoneSuffix } },
      include: { report: true },
    });
  }

  if (!booking?.report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const fileBuffer = await reportStorage.read(booking.report.storageKey);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${booking.report.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
