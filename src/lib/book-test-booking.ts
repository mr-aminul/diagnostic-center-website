import { db } from "@/lib/db";
import { generateReferenceCode } from "@/lib/reference-code";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { isPastDateString } from "@/lib/time-slots";
import { formatBdPhoneForStorage } from "@/lib/phone";
import { isSlotAvailable } from "@/lib/slot-availability";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";

export type BookTestBookingError =
  | "errorEmptyTests"
  | "errorPhoneInvalid"
  | "errorAddressRequired"
  | "errorPastDate"
  | "errorSlotFull"
  | "errorGenderRequired"
  | "generic";

export interface BookTestBookingItem {
  type: "test" | "package";
  id: string;
}

export interface BookTestBookingInput {
  collectionType: "IN_CENTER" | "HOME";
  items: BookTestBookingItem[];
  patientName: string;
  phone: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  branchId?: string;
  preferredDate?: string;
  preferredTime?: string;
  address?: string;
  notes?: string;
  paymentMethod?: "CASH" | "ONLINE";
  doctorId?: string;
}

export type BookTestBookingResult =
  | {
      ok: true;
      bookingId: string;
      referenceCode: string;
      estimatedTotal: number;
      paymentMethod: "CASH" | "ONLINE";
      patientPhone: string;
      preparations: string[];
    }
  | { ok: false; error: BookTestBookingError };

const MAX_REFERENCE_CODE_ATTEMPTS = 5;

export async function bookTestBooking(
  input: BookTestBookingInput,
): Promise<BookTestBookingResult> {
  if (!input.items.length) {
    return { ok: false, error: "errorEmptyTests" };
  }

  if (!input.gender) {
    return { ok: false, error: "errorGenderRequired" };
  }

  const phone = formatBdPhoneForStorage(input.phone);
  if (!phone) {
    return { ok: false, error: "errorPhoneInvalid" };
  }

  if (input.collectionType === "HOME" && !input.address?.trim()) {
    return { ok: false, error: "errorAddressRequired" };
  }

  if (input.preferredDate && isPastDateString(input.preferredDate)) {
    return { ok: false, error: "errorPastDate" };
  }

  if (!(await isSlotAvailable(input.preferredDate, input.preferredTime))) {
    return { ok: false, error: "errorSlotFull" };
  }

  const site = await getResolvedSiteConfig();
  const paymentMethod = input.paymentMethod ?? "CASH";

  if (paymentMethod === "ONLINE" && !site.features.onlinePayment) {
    return { ok: false, error: "generic" };
  }

  const testIds = input.items.filter((item) => item.type === "test").map((item) => item.id);
  const packageIds = input.items
    .filter((item) => item.type === "package")
    .map((item) => item.id);

  const [tests, packages, doctor] = await Promise.all([
    testIds.length
      ? db.test.findMany({ where: { id: { in: testIds }, isActive: true } })
      : Promise.resolve([]),
    packageIds.length
      ? db.package.findMany({
          where: { id: { in: packageIds }, isActive: true },
          include: { tests: { include: { test: true } } },
        })
      : Promise.resolve([]),
    input.doctorId
      ? db.doctor.findFirst({ where: { id: input.doctorId, isActive: true } })
      : Promise.resolve(null),
  ]);

  if (tests.length !== testIds.length || packages.length !== packageIds.length) {
    return { ok: false, error: "generic" };
  }

  const bookingItems = [
    ...tests.map((test) => ({
      testId: test.id,
      nameSnapshot: test.name,
      priceSnapshot: test.price,
    })),
    ...packages.map((pkg) => ({
      packageId: pkg.id,
      nameSnapshot: pkg.name,
      priceSnapshot: pkg.price,
    })),
  ];

  const estimatedTotal = bookingItems.reduce(
    (sum, item) => sum + Number(item.priceSnapshot),
    0,
  );

  const preparations = [
    ...tests
      .map((test) => test.preparation)
      .filter((value): value is string => Boolean(value?.trim())),
    ...packages.flatMap((pkg) =>
      pkg.tests
        .map(({ test }) => test.preparation)
        .filter((value): value is string => Boolean(value?.trim())),
    ),
  ];
  const uniquePreparations = [...new Set(preparations)];

  let notes = input.notes;
  if (doctor) {
    const consultNote = `Consultation request with ${doctor.name}`;
    notes = notes ? `${consultNote}. ${notes}` : consultNote;
  }

  let referenceCode = generateReferenceCode();
  for (let attempt = 0; attempt < MAX_REFERENCE_CODE_ATTEMPTS; attempt += 1) {
    const existing = await db.booking.findUnique({ where: { referenceCode } });
    if (!existing) break;
    referenceCode = generateReferenceCode();
  }

  const paymentStatus =
    paymentMethod === "ONLINE" ? ("PENDING_ONLINE" as const) : ("UNPAID" as const);

  const booking = await db.booking.create({
    data: {
      referenceCode,
      patientName: input.patientName.trim(),
      phone,
      age: input.age,
      gender: input.gender,
      collectionType: input.collectionType,
      address: input.collectionType === "HOME" ? input.address : undefined,
      branchId: input.branchId,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      preferredTime: input.preferredTime,
      notes,
      estimatedTotal,
      paymentMethod,
      paymentStatus,
      items: { create: bookingItems },
    },
  });

  const prepSms =
    uniquePreparations.length > 0
      ? ` Preparation: ${uniquePreparations.slice(0, 2).join("; ")}.`
      : "";

  const paymentSms =
    paymentMethod === "ONLINE"
      ? site.payment.provider === "demo"
        ? ` Complete the demo online payment on our website (no real charge).`
        : ` Online payment is pending — complete payment on our website.`
      : ` Estimated total ৳${estimatedTotal.toFixed(0)}. Pay at the center or during collection.`;

  await sendSms(
    phone,
    `Thank you for booking with ${site.shortName}. Ref ${referenceCode} (for staff).${paymentSms}${prepSms} Track reports anytime with your phone number on our website — no need to remember the code.`,
  );

  await sendEmail({
    to: site.contact.email,
    subject: `New booking ${referenceCode}`,
    text: `Patient: ${input.patientName}\nPhone: ${phone}\nReference: ${referenceCode}\nTotal: ৳${estimatedTotal}\nPayment: ${paymentMethod}`,
  });

  return {
    ok: true,
    bookingId: booking.id,
    referenceCode,
    estimatedTotal,
    paymentMethod,
    patientPhone: phone,
    preparations: uniquePreparations,
  };
}
