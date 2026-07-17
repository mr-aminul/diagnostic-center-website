import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");

  const [staff, branches] = await Promise.all([
    db.staffUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        employeeCode: true,
        branchId: true,
        isActive: true,
        branch: { select: { id: true, name: true } },
      },
    }),
    db.branch.findMany({
      where: { isActive: true },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return <StaffManager staff={staff} branches={branches} currentUserId={session.userId} />;
}
