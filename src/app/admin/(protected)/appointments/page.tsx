import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AppointmentStatusForm } from "@/components/admin/appointment-status-form";
import { BookAppointmentDialog } from "@/components/admin/book-appointment-dialog";
import { formatDate } from "@/lib/format";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
const DATE_FILTERS = ["all", "today", "upcoming", "past"] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date = new Date()) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; doctor?: string; date?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();
  const status = params.status;
  const doctorId = params.doctor?.trim();
  const dateFilter = DATE_FILTERS.includes(params.date as (typeof DATE_FILTERS)[number])
    ? (params.date as (typeof DATE_FILTERS)[number])
    : "all";

  const where: Prisma.DoctorAppointmentWhereInput = {};

  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status as (typeof STATUSES)[number];
  }

  if (doctorId && doctorId !== "all") {
    where.doctorId = doctorId;
  }

  const todayStart = startOfUtcDay();
  const todayEnd = endOfUtcDay();
  if (dateFilter === "today") {
    where.appointmentDate = { gte: todayStart, lt: todayEnd };
  } else if (dateFilter === "upcoming") {
    where.appointmentDate = { gte: todayStart };
  } else if (dateFilter === "past") {
    where.appointmentDate = { lt: todayStart };
  }

  if (query) {
    where.OR = [
      { patientName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
      { doctor: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  const [appointments, doctors] = await Promise.all([
    db.doctorAppointment.findMany({
      where,
      include: { doctor: { select: { id: true, name: true, specialty: true } } },
      orderBy: [{ appointmentDate: "desc" }, { serialNumber: "asc" }],
      take: 100,
    }),
    db.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameBn: true,
        specialty: true,
        specialtyBn: true,
        degrees: true,
        photoUrl: true,
        schedule: true,
        scheduleBn: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <AdminFilterBar
        searchPlaceholder="Search patient, phone, or doctor"
        searchDefaultValue={query}
        filters={[
          {
            name: "status",
            label: "Status",
            defaultValue: status ?? "all",
            options: [
              { value: "all", label: "All statuses" },
              ...STATUSES.map((item) => ({
                value: item,
                label: STATUS_LABELS[item],
              })),
            ],
          },
          {
            name: "doctor",
            label: "Doctor",
            defaultValue: doctorId ?? "all",
            className: "w-52",
            options: [
              { value: "all", label: "All doctors" },
              ...doctors.map((doctor) => ({
                value: doctor.id,
                label: doctor.name,
              })),
            ],
          },
          {
            name: "date",
            label: "Date",
            defaultValue: dateFilter,
            options: [
              { value: "all", label: "All dates" },
              { value: "today", label: "Today" },
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
            ],
          },
        ]}
      >
        <div className="ml-auto flex items-end">
          <BookAppointmentDialog doctors={doctors} />
        </div>
      </AdminFilterBar>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Estimated Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(appointment.appointmentDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">#{appointment.serialNumber}</Badge>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{appointment.patientName}</p>
                  <p className="text-xs text-muted-foreground">{appointment.phone}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{appointment.doctor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.doctor.specialty}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {appointment.estimatedTime}
                </TableCell>
                <TableCell>
                  <AppointmentStatusForm
                    appointmentId={appointment.id}
                    currentStatus={appointment.status}
                  />
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
