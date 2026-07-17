import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AdminBookingForm } from "@/components/admin/admin-booking-form";
import {
  BookingSection,
  BookingWorkspace,
} from "@/components/admin/booking-workspace";
import { getTests, getPackages } from "@/lib/data/catalog";
import { getBranches } from "@/lib/data/branches";
import { toNumber } from "@/lib/format";

export default async function AdminNewBookingPage() {
  const [tests, packages, branches] = await Promise.all([
    getTests(),
    getPackages(),
    getBranches(),
  ]);

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
          <h1 className="text-lg font-semibold tracking-tight">New booking</h1>
        </div>
      }
      aside={
        <BookingSection title="Report" className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>
              After you create this booking, upload a PDF report for each test or
              package here — same place as on every booking detail page.
            </p>
          </div>
        </BookingSection>
      }
    >
      <AdminBookingForm
        mode="create"
        catalog={catalog}
        branches={branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
        }))}
      />
    </BookingWorkspace>
  );
}
