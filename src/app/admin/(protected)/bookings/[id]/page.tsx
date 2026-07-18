import { notFound } from "next/navigation";
import { BookingDetailClient } from "@/components/admin/booking-detail-client";
import { canCancelBooking } from "@/lib/booking-cancel";
import { getBranches } from "@/lib/data/branches";
import { getPackages, getTests } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";

function toDateInputValue(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [booking, branches, tests, packages] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        items: { include: { report: true } },
        branch: true,
        payments: { orderBy: { paidAt: "asc" } },
      },
    }),
    getBranches(),
    getTests(),
    getPackages(),
  ]);

  if (!booking) notFound();

  const catalog = [
    ...packages.map((pkg) => ({
      type: "package" as const,
      id: pkg.id,
      name: pkg.name,
      nameBn: pkg.nameBn,
      price: toNumber(pkg.price),
    })),
    ...tests.map((test) => ({
      type: "test" as const,
      id: test.id,
      name: test.name,
      nameBn: test.nameBn,
      price: toNumber(test.price),
    })),
  ];

  const transactions = booking.payments.map((payment) => ({
    id: payment.id,
    kind: payment.kind,
    amount: Number(payment.amount),
    method: payment.method,
    reference: payment.reference,
    note: payment.note,
    paidAt: payment.paidAt.toISOString(),
  }));

  const items = booking.items.map((item) => ({
    id: item.id,
    name: item.nameSnapshot,
    type: (item.packageId ? "package" : "test") as "test" | "package",
    catalogId: (item.packageId ?? item.testId) as string,
    price: Number(item.priceSnapshot),
    hasReport: Boolean(item.report),
    isCancelled: item.cancelledAt != null,
  }));

  const reportItems = booking.items.map((item) => ({
    id: item.id,
    name: item.nameSnapshot,
    type: (item.packageId ? "package" : "test") as "test" | "package",
    report: item.report ? { fileName: item.report.fileName } : null,
    isCancelled: item.cancelledAt != null,
  }));

  const cancelGate = canCancelBooking(booking);

  return (
    <BookingDetailClient
      bookingId={booking.id}
      referenceCode={booking.referenceCode}
      status={booking.status}
      canCancel={cancelGate.ok}
      cancelBlockedReason={cancelGate.ok ? null : cancelGate.reason}
      catalog={catalog}
      branches={branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
      }))}
      branchName={booking.branch?.name ?? null}
      defaults={{
        patientName: booking.patientName,
        phone: booking.phone,
        age: booking.age,
        gender: booking.gender,
        collectionType: booking.collectionType,
        address: booking.address,
        branchId: booking.branchId,
        preferredDate: toDateInputValue(booking.preferredDate),
        preferredTime: booking.preferredTime,
        notes: booking.notes,
      }}
      estimatedTotal={Number(booking.estimatedTotal)}
      amountPaid={Number(booking.amountPaid)}
      discountTotal={Number(booking.discountTotal)}
      transactions={transactions}
      items={items}
      reportItems={reportItems}
    />
  );
}
