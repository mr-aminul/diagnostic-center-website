import { db } from "@/lib/db";
import { BranchesManager } from "@/components/admin/branches-manager";

export default async function AdminBranchesPage() {
  const branches = await db.branch.findMany({ orderBy: [{ isMain: "desc" }, { name: "asc" }] });
  return <BranchesManager branches={branches} />;
}
