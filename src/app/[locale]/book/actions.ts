"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { generateReferenceCode } from "@/lib/reference-code";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { isPastDateString } from "@/lib/time-slots";
import { lastDigits } from "@/lib/phone";
import { isSlotAvailable } from "@/lib/slot-availability";

const itemSchema = z.object({
  type: z.enum(["test", "package"]),
  id: z.string().min(1),
});

const bookingSchema = z.object({
  collectionType: z.enum(["IN_CENTER", "HOME"]),
  items: z.array(itemSchema).min(1),
  patientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  age: z.coerce.number().int().min(0).max(130).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  branchId: z.string().min(1).optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["CASH", "ONLINE"]).default("CASH"),
  doctorId: z.string().optional(),
});

export interface BookingFormState {
  status: "idle" | "success" | "error";
  referenceCode?: string;
  estimatedTotal?: number;
  paymentMethod?: "CASH" | "ONLINE";
  patientPhone?: string;
  preparations?: string[];
  errorMessage?: string;
}

const MAX_REFERENCE_CODE_ATTEMPTS = 5;

export async function createBooking(
  _previousState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  let itemsInput: unknown;
  try {
    itemsInput = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", errorMessage: "errorEmptyTests" };
  }

  const parsed = bookingSchema.safeParse({
    collectionType: formData.get("collectionType"),
    items: itemsInput,
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    age: formData.get("age") || undefined,
    gender: formData.get("gender") || undefined,
    branchId: formData.get("branchId") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    paymentMethod: formData.get("paymentMethod") || "CASH",
    doctorId: formData.get("doctorId") || undefined,
  });

  if (!parsed.success) {
    const hasItemsIssue = parsed.error.issues.some((issue) => issue.path[0] === "items");
    return { status: "error", errorMessage: hasItemsIssue ? "errorEmptyTests" : "generic" };
  }

  const data = parsed.data;

  if (lastDigits(data.phone).length < 10) {
    return { status: "error", errorMessage: "errorPhoneInvalid" };
  }

  if (data.collectionType === "HOME" && !data.address) {
    return { status: "error", errorMessage: "errorAddressRequired" };
  }

  if (data.preferredDate && isPastDateString(data.preferredDate)) {
    return { status: "error", errorMessage: "errorPastDate" };
  }

  if (!(await isSlotAvailable(data.preferredDate, data.preferredTime))) {
    return { status: "error", errorMessage: "errorSlotFull" };
  }

  if (data.paymentMethod === "ONLINE" && !siteConfig.features.onlinePayment) {
    return { status: "error", errorMessage: "generic" };
  }

  const testIds = data.items.filter((item) => item.type === "test").map((item) => item.id);
  const packageIds = data.items.filter((item) => item.type === "package").map((item) => item.id);

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
    data.doctorId
      ? db.doctor.findFirst({ where: { id: data.doctorId, isActive: true } })
      : Promise.resolve(null),
  ]);

  if (tests.length !== testIds.length || packages.length !== packageIds.length) {
    return { status: "error", errorMessage: "generic" };
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
    0
  );

  const preparations = [
    ...tests
      .map((test) => test.preparation)
      .filter((value): value is string => Boolean(value?.trim())),
    ...packages.flatMap((pkg) =>
      pkg.tests
        .map(({ test }) => test.preparation)
        .filter((value): value is string => Boolean(value?.trim()))
    ),
  ];
  const uniquePreparations = [...new Set(preparations)];

  let notes = data.notes;
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

  const paymentMethod = data.paymentMethod;
  const paymentStatus =
    paymentMethod === "ONLINE" ? ("PENDING_ONLINE" as const) : ("UNPAID" as const);

  await db.booking.create({
    data: {
      referenceCode,
      patientName: data.patientName,
      phone: data.phone,
      age: data.age,
      gender: data.gender,
      collectionType: data.collectionType,
      address: data.collectionType === "HOME" ? data.address : undefined,
      branchId: data.branchId,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
      preferredTime: data.preferredTime,
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
      ? siteConfig.payment.provider === "demo"
        ? ` Complete the demo online payment on our website (no real charge).`
        : ` Online payment is pending — complete payment on our website.`
      : ` Estimated total ৳${estimatedTotal.toFixed(0)}. Pay at the center or during collection.`;

  await sendSms(
    data.phone,
    `Thank you for booking with ${siteConfig.shortName}. Ref ${referenceCode} (for staff).${paymentSms}${prepSms} Track reports anytime with your phone number on our website — no need to remember the code.`
  );

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `New booking ${referenceCode}`,
    text: `Patient: ${data.patientName}\nPhone: ${data.phone}\nReference: ${referenceCode}\nTotal: ৳${estimatedTotal}\nPayment: ${paymentMethod}`,
  });

  return {
    status: "success",
    referenceCode,
    estimatedTotal,
    paymentMethod,
    patientPhone: data.phone,
    preparations: uniquePreparations,
  };
}
