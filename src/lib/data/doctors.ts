import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

async function queryDoctors() {
  return db.doctor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export const getDoctors = cache(async () =>
  unstable_cache(queryDoctors, ["doctors-active"], {
    revalidate: 60,
    tags: ["doctors"],
  })(),
);

export const getDoctorById = cache(async (id: string) =>
  db.doctor.findFirst({
    where: { id, isActive: true },
  }),
);
