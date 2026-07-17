import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { Locale } from "@/config/site";

async function queryFaqItems() {
  return db.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export const getFaqItems = cache(async () =>
  unstable_cache(queryFaqItems, ["faq-items-active"], {
    revalidate: 60,
    tags: ["faq"],
  })(),
);

export async function getLocalizedFaqItems(locale: Locale) {
  const items = await getFaqItems();
  return items.map((item) => ({
    question: locale === "bn" ? item.questionBn || item.questionEn : item.questionEn,
    answer: locale === "bn" ? item.answerBn || item.answerEn : item.answerEn,
  }));
}
