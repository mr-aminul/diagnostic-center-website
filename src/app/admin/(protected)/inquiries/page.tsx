import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { InquiriesManager } from "@/components/admin/inquiries-manager";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();
  const status = params.status;

  const where: Prisma.ContactInquiryWhereInput = {};
  if (status === "new") where.isRead = false;
  if (status === "read") where.isRead = true;
  if (status === "replied") where.repliedAt = { not: null };
  if (status === "unreplied") where.repliedAt = null;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
      { email: { contains: query, mode: "insensitive" } },
      { message: { contains: query, mode: "insensitive" } },
    ];
  }

  const inquiries = await db.contactInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <AdminFilterBar
        searchPlaceholder="Search name, phone, email, or message"
        searchDefaultValue={query}
        filters={[
          {
            name: "status",
            label: "Status",
            defaultValue: status ?? "all",
            options: [
              { value: "all", label: "All messages" },
              { value: "new", label: "New" },
              { value: "read", label: "Read" },
              { value: "unreplied", label: "Needs reply" },
              { value: "replied", label: "Replied" },
            ],
          },
        ]}
      />

      <InquiriesManager inquiries={inquiries} />
    </div>
  );
}
