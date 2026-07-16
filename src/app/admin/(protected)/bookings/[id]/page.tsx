import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusForm } from "@/components/admin/booking-status-form";
import { PaymentStatusForm } from "@/components/admin/payment-status-form";
import { ReportUploadForm } from "@/components/admin/report-upload-form";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { items: true, branch: true, report: true },
  });

  if (!booking) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/bookings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{booking.referenceCode}</h1>
          <p className="text-sm text-muted-foreground">
            Booked {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <Badge className="text-sm">{booking.status.replaceAll("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Name" value={booking.patientName} />
          <Field label="Phone" value={booking.phone} />
          <Field label="Age" value={booking.age?.toString() ?? "—"} />
          <Field label="Gender" value={booking.gender ?? "—"} />
          <Field label="Collection Type" value={booking.collectionType.replaceAll("_", " ")} />
          <Field label="Branch" value={booking.branch?.name ?? "—"} />
          {booking.collectionType === "HOME" && (
            <Field label="Address" value={booking.address ?? "—"} className="sm:col-span-2" />
          )}
          <Field
            label="Preferred Date"
            value={booking.preferredDate ? formatDateTime(booking.preferredDate) : "—"}
          />
          <Field label="Preferred Time" value={booking.preferredTime ?? "—"} />
          {booking.notes && <Field label="Notes" value={booking.notes} className="sm:col-span-2" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tests &amp; Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {booking.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span>{item.nameSnapshot}</span>
                <span className="font-medium">{formatCurrency(item.priceSnapshot)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t pt-3 font-semibold">
            <span>Estimated Total</span>
            <span>{formatCurrency(booking.estimatedTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingStatusForm bookingId={booking.id} currentStatus={booking.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentStatusForm
            bookingId={booking.id}
            currentStatus={booking.paymentStatus}
            paymentMethod={booking.paymentMethod}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.report && (
            <p className="text-sm text-muted-foreground">
              Current file: <span className="font-medium text-foreground">{booking.report.fileName}</span>{" "}
              (uploaded {formatDateTime(booking.report.uploadedAt)})
            </p>
          )}
          <ReportUploadForm bookingId={booking.id} hasExistingReport={Boolean(booking.report)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
