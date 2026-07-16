import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");

  const staff = await db.staffUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Staff users</h1>
        <p className="text-sm text-muted-foreground">
          Invite colleagues, reset passwords, and deactivate accounts. Admins only.
        </p>
      </div>
      <StaffManager staff={staff} />
    </div>
  );
}
