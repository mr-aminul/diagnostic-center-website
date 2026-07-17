import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { AdminBookingForm } from "@/components/admin/admin-booking-form";
import { BookingWorkspace } from "@/components/admin/booking-workspace";
import { BookingStatusForm } from "@/components/admin/booking-status-form";
import { BookingReportsPanel } from "@/components/admin/booking-reports-panel";
import { PaymentPanel } from "@/components/admin/payment-panel";
import { getBranches } from "@/lib/data/branches";
import { getPackages, getTests } from "@/lib/data/catalog";
import { formatDateTime, toNumber } from "@/lib/format";

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
  }));

  const reportItems = booking.items.map((item) => ({
    id: item.id,
    name: item.nameSnapshot,
    type: (item.packageId ? "package" : "test") as "test" | "package",
    report: item.report ? { fileName: item.report.fileName } : null,
  }));

  return (
    <BookingWorkspace
      header={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Bookings
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold tracking-tight">{booking.referenceCode}</h1>
          <BookingStatusForm bookingId={booking.id} currentStatus={booking.status} />
          <p className="text-sm text-muted-foreground sm:ml-auto">
            Booked {formatDateTime(booking.createdAt)}
          </p>
        </div>
      }
      aside={<BookingReportsPanel bookingId={booking.id} items={reportItems} />}
    >
      <AdminBookingForm
        mode="edit"
        catalog={catalog}
        branches={branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
        }))}
        bookingId={booking.id}
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
        invoice={
          <PaymentPanel
            key="booking-invoice"
            bookingId={booking.id}
            estimatedTotal={Number(booking.estimatedTotal)}
            amountPaid={Number(booking.amountPaid)}
            discountTotal={Number(booking.discountTotal)}
            transactions={transactions}
            items={items}
            catalog={catalog}
          />
        }
      />
    </BookingWorkspace>
  );
}
