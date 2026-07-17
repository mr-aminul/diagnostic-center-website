import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { Locale } from "@/config/site";

async function queryTestimonials() {
  return db.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export const getTestimonials = cache(async () =>
  unstable_cache(queryTestimonials, ["testimonials-active"], {
    revalidate: 60,
    tags: ["testimonials"],
  })(),
);

export async function getLocalizedTestimonials(locale: Locale) {
  const items = await getTestimonials();
  return items.map((item) => ({
    name: locale === "bn" ? item.nameBn || item.nameEn : item.nameEn,
    role: locale === "bn" ? item.roleBn || item.roleEn : item.roleEn,
    quote: locale === "bn" ? item.quoteBn || item.quoteEn : item.quoteEn,
  }));
}
