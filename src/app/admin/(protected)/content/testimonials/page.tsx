import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";

export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const items = await db.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return <TestimonialsManager items={items} />;
}
