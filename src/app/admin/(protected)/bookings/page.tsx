import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { LinkTableRow } from "@/components/admin/admin-table-row";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
  "CANCELLED",
] as const;

const COLLECTIONS = ["IN_CENTER", "HOME"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PENDING_ONLINE", "PARTIAL", "PAID"] as const;
const DATE_FILTERS = ["all", "today", "week", "older"] as const;

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    collection?: string;
    payment?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();
  const status = params.status;
  const collection = params.collection;
  const payment = params.payment;
  const dateFilter = DATE_FILTERS.includes(params.date as (typeof DATE_FILTERS)[number])
    ? (params.date as (typeof DATE_FILTERS)[number])
    : "all";

  const where: Prisma.BookingWhereInput = {};

  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status as (typeof STATUSES)[number];
  }

  if (collection && COLLECTIONS.includes(collection as (typeof COLLECTIONS)[number])) {
    where.collectionType = collection as (typeof COLLECTIONS)[number];
  }

  if (payment && PAYMENT_STATUSES.includes(payment as (typeof PAYMENT_STATUSES)[number])) {
    where.paymentStatus = payment as (typeof PAYMENT_STATUSES)[number];
  }

  const todayStart = startOfUtcDay();
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (dateFilter === "today") {
    where.createdAt = { gte: todayStart };
  } else if (dateFilter === "week") {
    where.createdAt = { gte: weekStart };
  } else if (dateFilter === "older") {
    where.createdAt = { lt: weekStart };
  }

  if (query) {
    where.OR = [
      { referenceCode: { contains: query, mode: "insensitive" } },
      { patientName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Test and package bookings from the public site or hotline.
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="h-4 w-4" />
          Book test
        </Link>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search by name, phone, or reference code"
        searchDefaultValue={query}
        filters={[
          {
            name: "status",
            label: "Status",
            defaultValue: status ?? "all",
            className: "w-48",
            options: [
              { value: "all", label: "All statuses" },
              ...STATUSES.map((item) => ({
                value: item,
                label: item.replaceAll("_", " "),
              })),
            ],
          },
          {
            name: "collection",
            label: "Collection",
            defaultValue: collection ?? "all",
            options: [
              { value: "all", label: "All collection" },
              { value: "IN_CENTER", label: "In center" },
              { value: "HOME", label: "Home collection" },
            ],
          },
          {
            name: "payment",
            label: "Payment",
            defaultValue: payment ?? "all",
            options: [
              { value: "all", label: "All payments" },
              { value: "UNPAID", label: "Unpaid" },
              { value: "PENDING_ONLINE", label: "Pending online" },
              { value: "PARTIAL", label: "Partial" },
              { value: "PAID", label: "Paid" },
            ],
          },
          {
            name: "date",
            label: "Booked",
            defaultValue: dateFilter,
            options: [
              { value: "all", label: "All dates" },
              { value: "today", label: "Today" },
              { value: "week", label: "Last 7 days" },
              { value: "older", label: "Older than 7 days" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => (
              <LinkTableRow key={booking.id} href={`/admin/bookings/${booking.id}`}>
                <TableCell>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {booking.referenceCode}
                  </Link>
                </TableCell>
                <TableCell>{booking.patientName}</TableCell>
                <TableCell>{booking.phone}</TableCell>
                <TableCell>{booking.collectionType.replaceAll("_", " ")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{booking.paymentStatus.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(booking.estimatedTotal)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(booking.createdAt)}
                </TableCell>
              </LinkTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
