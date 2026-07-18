"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { createReportDownloadToken } from "@/lib/report-token";
import { estimateReadyLabel } from "@/lib/booking-status";
import { isPastDateString, TIME_SLOT_VALUES } from "@/lib/time-slots";
import { isSlotAvailable } from "@/lib/slot-availability";
import { issuePhoneOtp, phoneKeyFromInput, verifyPhoneOtp } from "@/lib/phone-otp";
import {
  clearPatientSessionCookie,
  getPatientSession,
  setPatientSessionCookie,
} from "@/lib/patient-session";

const phoneSchema = z.object({
  phone: z.string().trim().min(6).max(20),
});

const otpSchema = phoneSchema.extend({
  otp: z.string().trim().min(4).max(8),
});

const bookingIdSchema = z.object({
  bookingId: z.string().min(1),
});

const rescheduleSchema = bookingIdSchema.extend({
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

export interface TrackBookingItemView {
  id: string;
  name: string;
  price: number;
  hasReport: boolean;
  reportFileName?: string;
  reportUploadedAt?: string;
  downloadToken?: string;
}

export interface TrackBookingView {
  id: string;
  referenceCode: string;
  status: string;
  createdAt: string;
  /** True when at least one line-item report is ready. */
  hasReport: boolean;
  patientName: string;
  collectionType: string;
  preferredDate: string | null;
  preferredTime: string | null;
  estimatedTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  estimatedReady: string;
  items: TrackBookingItemView[];
  canCancel: boolean;
  canReschedule: boolean;
}

export type TrackPortalState =
  | { status: "idle" }
  | { status: "otp_sent"; phone: string }
  | { status: "verified"; phone: string; bookings: TrackBookingView[] }
  | { status: "empty"; phone: string }
  | { status: "error"; errorMessage: string; phone?: string; step?: "phone" | "otp" }
  | {
      status: "updated";
      phone: string;
      bookings: TrackBookingView[];
      notice: "cancelled" | "rescheduled" | "sms_sent";
      focusBookingId?: string;
    };

const bookingInclude = {
  items: {
    include: {
      report: true,
      test: true,
      package: { include: { tests: { include: { test: true } } } },
    },
  },
} as const;

type BookingWithRelations = Awaited<
  ReturnType<
    typeof db.booking.findFirst<{ include: typeof bookingInclude }>
  >
>;

async function toBookingView(
  booking: NonNullable<BookingWithRelations>,
  locale: "en" | "bn" = "en"
): Promise<TrackBookingView> {
  const activeItems = booking.items.filter((item) => item.cancelledAt == null);
  const turnarounds = activeItems.flatMap((item) => {
    if (item.test?.turnaroundTime) return [item.test.turnaroundTime];
    if (item.package) {
      return item.package.tests.map(({ test }) => test.turnaroundTime);
    }
    return [];
  });

  const canManage = booking.status === "PENDING" || booking.status === "CONFIRMED";

  const items: TrackBookingItemView[] = await Promise.all(
    activeItems.map(async (item) => {
      let downloadToken: string | undefined;
      if (item.report) {
        downloadToken = await createReportDownloadToken({
          referenceCode: booking.referenceCode,
          bookingId: booking.id,
          bookingItemId: item.id,
        });
      }
      return {
        id: item.id,
        name: item.nameSnapshot,
        price: Number(item.priceSnapshot),
        hasReport: Boolean(item.report),
        reportFileName: item.report?.fileName,
        reportUploadedAt: item.report?.uploadedAt.toISOString(),
        downloadToken,
      };
    }),
  );

  return {
    id: booking.id,
    referenceCode: booking.referenceCode,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    hasReport: items.some((item) => item.hasReport),
    patientName: booking.patientName,
    collectionType: booking.collectionType,
    preferredDate: booking.preferredDate
      ? booking.preferredDate.toISOString().slice(0, 10)
      : null,
    preferredTime: booking.preferredTime,
    estimatedTotal: Number(booking.estimatedTotal),
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    estimatedReady: estimateReadyLabel(turnarounds, locale),
    items,
    canCancel: canManage,
    canReschedule: canManage,
  };
}

async function listBookingsForPhoneKey(
  phoneKey: string,
  locale: "en" | "bn"
): Promise<TrackBookingView[]> {
  const bookings = await db.booking.findMany({
    where: { phone: { contains: phoneKey.slice(-10) } },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(bookings.map((booking) => toBookingView(booking, locale)));
}

async function requireOwnedBooking(bookingId: string) {
  const session = await getPatientSession();
  if (!session) return null;

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      phone: { contains: session.phoneKey.slice(-10) },
    },
    include: bookingInclude,
  });

  return booking ? { session, booking } : null;
}

function localeFromForm(formData: FormData): "en" | "bn" {
  return formData.get("locale") === "bn" ? "bn" : "en";
}

export async function requestTrackOtp(
  _previous: TrackPortalState,
  formData: FormData
): Promise<TrackPortalState> {
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success || !phoneKeyFromInput(parsed.data.phone)) {
    return { status: "error", errorMessage: "errorPhoneInvalid", step: "phone" };
  }

  const result = await issuePhoneOtp(parsed.data.phone);
  if (result.ok === false) {
    if (result.error === "no_bookings") {
      return { status: "empty", phone: parsed.data.phone };
    }
    if (result.error === "cooldown") {
      return {
        status: "error",
        errorMessage: "errorOtpCooldown",
        phone: parsed.data.phone,
        step: "phone",
      };
    }
    return {
      status: "error",
      errorMessage: "errorPhoneInvalid",
      phone: parsed.data.phone,
      step: "phone",
    };
  }

  return { status: "otp_sent", phone: parsed.data.phone };
}

export async function verifyTrackOtp(
  _previous: TrackPortalState,
  formData: FormData
): Promise<TrackPortalState> {
  const parsed = otpSchema.safeParse({
    phone: formData.get("phone"),
    otp: formData.get("otp"),
  });
  const locale = localeFromForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      errorMessage: "errorOtpInvalid",
      phone: String(formData.get("phone") ?? ""),
      step: "otp",
    };
  }

  const verified = await verifyPhoneOtp(parsed.data.phone, parsed.data.otp);
  if (!verified.ok) {
    const message =
      verified.error === "expired"
        ? "errorOtpExpired"
        : verified.error === "locked"
          ? "errorOtpLocked"
          : "errorOtpInvalid";
    return {
      status: "error",
      errorMessage: message,
      phone: parsed.data.phone,
      step: "otp",
    };
  }

  await setPatientSessionCookie({
    phoneKey: verified.phoneKey,
    phoneDisplay: parsed.data.phone,
  });

  const bookings = await listBookingsForPhoneKey(verified.phoneKey, locale);
  if (bookings.length === 0) {
    return { status: "empty", phone: parsed.data.phone };
  }

  return { status: "verified", phone: parsed.data.phone, bookings };
}

export async function getInitialTrackPortalState(
  locale: "en" | "bn"
): Promise<TrackPortalState> {
  const session = await getPatientSession();
  if (!session) return { status: "idle" };

  const bookings = await listBookingsForPhoneKey(session.phoneKey, locale);
  if (bookings.length === 0) {
    return { status: "empty", phone: session.phoneDisplay };
  }
  return { status: "verified", phone: session.phoneDisplay, bookings };
}

export async function logoutPatientPortal(): Promise<void> {
  await clearPatientSessionCookie();
}

export async function cancelBooking(
  _previous: TrackPortalState,
  formData: FormData
): Promise<TrackPortalState> {
  const locale = localeFromForm(formData);
  const parsed = bookingIdSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) {
    return { status: "error", errorMessage: "errorInvalid" };
  }

  const owned = await requireOwnedBooking(parsed.data.bookingId);
  if (!owned) {
    return { status: "error", errorMessage: "errorSessionExpired", step: "phone" };
  }

  const { booking, session } = owned;
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { status: "error", errorMessage: "errorCannotCancel" };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  await sendSms(
    booking.phone,
    `Your booking ${booking.referenceCode} at ${siteConfig.shortName} has been cancelled. Call ${siteConfig.contact.phones[0]} if this was a mistake.`
  );

  const bookings = await listBookingsForPhoneKey(session.phoneKey, locale);
  return {
    status: "updated",
    phone: session.phoneDisplay,
    bookings,
    notice: "cancelled",
    focusBookingId: booking.id,
  };
}

export async function rescheduleBooking(
  _previous: TrackPortalState,
  formData: FormData
): Promise<TrackPortalState> {
  const locale = localeFromForm(formData);
  const parsed = rescheduleSchema.safeParse({
    bookingId: formData.get("bookingId"),
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", errorMessage: "errorInvalid" };
  }

  if (!parsed.data.preferredDate) {
    return { status: "error", errorMessage: "errorRescheduleRequired" };
  }
  if (isPastDateString(parsed.data.preferredDate)) {
    return { status: "error", errorMessage: "errorPastDate" };
  }
  if (!(await isSlotAvailable(parsed.data.preferredDate, parsed.data.preferredTime))) {
    return { status: "error", errorMessage: "errorSlotFull" };
  }
  if (
    parsed.data.preferredTime &&
    !TIME_SLOT_VALUES.includes(
      parsed.data.preferredTime as (typeof TIME_SLOT_VALUES)[number]
    )
  ) {
    return { status: "error", errorMessage: "errorInvalid" };
  }

  const owned = await requireOwnedBooking(parsed.data.bookingId);
  if (!owned) {
    return { status: "error", errorMessage: "errorSessionExpired", step: "phone" };
  }

  const { booking, session } = owned;
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { status: "error", errorMessage: "errorCannotReschedule" };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      preferredDate: new Date(parsed.data.preferredDate),
      preferredTime: parsed.data.preferredTime,
      status: "PENDING",
    },
  });

  await sendSms(
    booking.phone,
    `Your booking ${booking.referenceCode} at ${siteConfig.shortName} was rescheduled to ${parsed.data.preferredDate}${parsed.data.preferredTime ? ` ${parsed.data.preferredTime}` : ""}. We will confirm shortly.`
  );

  const bookings = await listBookingsForPhoneKey(session.phoneKey, locale);
  return {
    status: "updated",
    phone: session.phoneDisplay,
    bookings,
    notice: "rescheduled",
    focusBookingId: booking.id,
  };
}

export async function resendStatusSms(
  _previous: TrackPortalState,
  formData: FormData
): Promise<TrackPortalState> {
  const locale = localeFromForm(formData);
  const parsed = bookingIdSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) {
    return { status: "error", errorMessage: "errorInvalid" };
  }

  const owned = await requireOwnedBooking(parsed.data.bookingId);
  if (!owned) {
    return { status: "error", errorMessage: "errorSessionExpired", step: "phone" };
  }

  const { booking, session } = owned;
  await sendSms(
    booking.phone,
    `${siteConfig.shortName}: booking ${booking.referenceCode} status is ${booking.status.replaceAll("_", " ")}. Open Track with your phone number anytime.`
  );

  const bookings = await listBookingsForPhoneKey(session.phoneKey, locale);
  return {
    status: "updated",
    phone: session.phoneDisplay,
    bookings,
    notice: "sms_sent",
    focusBookingId: booking.id,
  };
}
