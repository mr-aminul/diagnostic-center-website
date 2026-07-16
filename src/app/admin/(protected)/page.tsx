import Link from "next/link";
import { CalendarCheck, Clock, FileClock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <div className="divide-y">
            {recentBookings.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No bookings yet.</p>
            )}
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    {booking.patientName}{" "}
                    <span className="text-muted-foreground">({booking.referenceCode})</span>
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatDateTime(booking.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatCurrency(booking.estimatedTotal)}
                  </span>
                  <Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
