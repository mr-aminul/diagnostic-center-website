import { db } from "@/lib/db";
import { DoctorsManager } from "@/components/admin/doctors-manager";

export default async function AdminDoctorsPage() {
  const doctors = await db.doctor.findMany({ orderBy: { name: "asc" } });
  return <DoctorsManager doctors={doctors} />;
}
