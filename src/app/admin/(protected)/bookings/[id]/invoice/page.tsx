import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { formatDate } from "@/lib/format";
import { hasCustomLogo } from "@/lib/theme";
import {
  BookingInvoiceDocument,
  BookingInvoiceToolbar,
} from "@/components/admin/booking-invoice";

export default async function AdminBookingInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const [booking, site] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        items: { orderBy: { id: "asc" } },
        branch: true,
        payments: {
          where: { kind: { in: ["PAYMENT", "REFUND"] } },
          orderBy: { paidAt: "asc" },
        },
      },
    }),
    getResolvedSiteConfig(),
  ]);

  if (!booking) notFound();

  const autoPrint = query.print === "1";

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <BookingInvoiceToolbar bookingId={booking.id} autoPrint={autoPrint} />
      <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <BookingInvoiceDocument
          center={{
            name: site.name,
            shortName: site.shortName,
            phones: site.contact.phones,
            email: site.contact.email,
            logoSrc: hasCustomLogo(site.logo.src) ? site.logo.src : null,
          }}
          booking={{
            referenceCode: booking.referenceCode,
            patientName: booking.patientName,
            phone: booking.phone,
            age: booking.age,
            gender: booking.gender,
            address: booking.address,
            collectionType: booking.collectionType,
            branchName: booking.branch?.name ?? null,
            preferredDate: booking.preferredDate
              ? formatDate(booking.preferredDate)
              : null,
            preferredTime: booking.preferredTime,
            estimatedTotal: Number(booking.estimatedTotal),
            amountPaid: Number(booking.amountPaid),
            discountTotal: Number(booking.discountTotal),
            createdAt: booking.createdAt.toISOString(),
            notes: booking.notes,
            items: booking.items.map((item) => ({
              id: item.id,
              name: item.nameSnapshot,
              price: Number(item.priceSnapshot),
              isCancelled: item.cancelledAt != null,
            })),
            payments: booking.payments.map((payment) => ({
              id: payment.id,
              kind: payment.kind,
              amount: Number(payment.amount),
              method: payment.method,
              reference: payment.reference,
            })),
          }}
        />
      </div>
    </div>
  );
}
