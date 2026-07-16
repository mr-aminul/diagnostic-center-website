import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
  "CANCELLED",
] as const;

const STATUS_FILTER_ITEMS: Record<"all" | (typeof STATUSES)[number], string> = {
  all: "All statuses",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SAMPLE_COLLECTED: "SAMPLE COLLECTED",
  PROCESSING: "PROCESSING",
  REPORT_READY: "REPORT READY",
  CANCELLED: "CANCELLED",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();
  const status = params.status;

  const where: Prisma.BookingWhereInput = {};
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status as (typeof STATUSES)[number];
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bookings</h1>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search by name, phone, or reference code"
          className="max-w-xs"
        />
        <Select
          name="status"
          defaultValue={status ?? "all"}
          items={STATUS_FILTER_ITEMS}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_FILTER_ITEMS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => (
              <TableRow key={booking.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/admin/bookings/${booking.id}`} className="font-medium text-primary hover:underline">
                    {booking.referenceCode}
                  </Link>
                </TableCell>
                <TableCell>{booking.patientName}</TableCell>
                <TableCell>{booking.phone}</TableCell>
                <TableCell>{booking.collectionType.replaceAll("_", " ")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(booking.estimatedTotal)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(booking.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
