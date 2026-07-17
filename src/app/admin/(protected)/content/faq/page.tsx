import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FaqManager } from "@/components/admin/faq-manager";

export default async function AdminFaqPage() {
  await requireAdmin();
  const items = await db.faqItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return <FaqManager items={items} />;
}
