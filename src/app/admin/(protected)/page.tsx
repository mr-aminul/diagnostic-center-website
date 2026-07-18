import Link from "next/link";
import { CalendarCheck, FileClock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkTableRow } from "@/components/admin/admin-table-row";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todaysBookings, pendingReports, totalBookings, recentBookings] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: startOfToday } } }),
    db.booking.count({
      where: {
        status: { in: ["CONFIRMED", "SAMPLE_COLLECTED", "PROCESSING"] },
      },
    }),
    db.booking.count(),
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        referenceCode: true,
        patientName: true,
        status: true,
        paymentStatus: true,
        estimatedTotal: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = [
    { label: "Bookings Today", value: todaysBookings, icon: CalendarCheck },
    { label: "Awaiting Report", value: pendingReports, icon: FileClock },
    { label: "Total Bookings", value: totalBookings, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No bookings yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentBookings.map((booking) => (
                  <LinkTableRow key={booking.id} href={`/admin/bookings/${booking.id}`}>
                    <TableCell>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {booking.referenceCode}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{booking.patientName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {booking.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {booking.paymentStatus.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(booking.estimatedTotal)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(booking.createdAt)}
                    </TableCell>
                  </LinkTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
