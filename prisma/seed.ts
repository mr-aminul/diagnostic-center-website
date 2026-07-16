import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { siteConfig } from "../src/config/site";
import { DEV_SAMPLE } from "../src/lib/dev-tools";
import categoriesData from "./seed-data/categories.json";
import doctorsData from "./seed-data/doctors.json";
import packagesData from "./seed-data/packages.json";
import testsData from "./seed-data/tests.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function seedBranches() {
  for (const branch of siteConfig.branches) {
    await db.branch.upsert({
      where: { id: branch.id },
      update: {
        name: branch.name.en,
        nameBn: branch.name.bn,
        address: branch.address.en,
        addressBn: branch.address.bn,
        phone: branch.phone,
        mapUrl: branch.mapEmbedUrl,
        isMain: branch.isMain,
      },
      create: {
        id: branch.id,
        name: branch.name.en,
        nameBn: branch.name.bn,
        address: branch.address.en,
        addressBn: branch.address.bn,
        phone: branch.phone,
        mapUrl: branch.mapEmbedUrl,
        isMain: branch.isMain,
      },
    });
  }
  console.log(`Seeded ${siteConfig.branches.length} branch(es).`);
}

async function seedCategoriesAndTests() {
  const categoryIdByKey = new Map<string, string>();

  for (const [index, category] of categoriesData.entries()) {
    const record = await db.testCategory.upsert({
      where: { name: category.name },
      update: { nameBn: category.nameBn, sortOrder: index },
      create: { name: category.name, nameBn: category.nameBn, sortOrder: index },
    });
    categoryIdByKey.set(category.key, record.id);
  }

  const testIdByName = new Map<string, string>();

  for (const test of testsData) {
    const categoryId = categoryIdByKey.get(test.category);
    if (!categoryId) {
      throw new Error(`Unknown category key "${test.category}" for test "${test.name}"`);
    }

    const record = await db.test.upsert({
      where: { id: `seed-${slugify(test.name)}` },
      update: {
        name: test.name,
        nameBn: test.nameBn,
        categoryId,
        price: test.price,
        sampleType: test.sampleType,
        preparation: test.preparation,
        preparationBn: test.preparationBn,
        turnaroundTime: test.turnaroundTime,
      },
      create: {
        id: `seed-${slugify(test.name)}`,
        name: test.name,
        nameBn: test.nameBn,
        categoryId,
        price: test.price,
        sampleType: test.sampleType,
        preparation: test.preparation,
        preparationBn: test.preparationBn,
        turnaroundTime: test.turnaroundTime,
      },
    });
    testIdByName.set(test.name, record.id);
  }

  console.log(`Seeded ${categoriesData.length} categories and ${testsData.length} tests.`);
  return testIdByName;
}

async function seedPackages(testIdByName: Map<string, string>) {
  for (const pkg of packagesData) {
    const id = `seed-${slugify(pkg.name)}`;
    const testIds = pkg.testNames.map((name) => {
      const testId = testIdByName.get(name);
      if (!testId) throw new Error(`Package "${pkg.name}" references unknown test "${name}"`);
      return testId;
    });

    await db.package.upsert({
      where: { id },
      update: {
        name: pkg.name,
        nameBn: pkg.nameBn,
        description: pkg.description,
        descriptionBn: pkg.descriptionBn,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        imageUrl: pkg.imageUrl,
        tests: {
          deleteMany: {},
          create: testIds.map((testId) => ({ testId })),
        },
      },
      create: {
        id,
        name: pkg.name,
        nameBn: pkg.nameBn,
        description: pkg.description,
        descriptionBn: pkg.descriptionBn,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        imageUrl: pkg.imageUrl,
        tests: { create: testIds.map((testId) => ({ testId })) },
      },
    });
  }
  console.log(`Seeded ${packagesData.length} packages.`);
}

async function seedDoctors() {
  if (!siteConfig.features.doctorsPage) return;

  for (const doctor of doctorsData) {
    const id = `seed-${slugify(doctor.name)}`;
    await db.doctor.upsert({
      where: { id },
      update: doctor,
      create: { id, ...doctor },
    });
  }
  console.log(`Seeded ${doctorsData.length} doctors.`);
}

async function seedAdminUser() {
  const existingAdmin = await db.staffUser.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log("An admin user already exists — skipping bootstrap admin creation.");
    return;
  }

  const name = process.env.SEED_ADMIN_NAME;
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !phone || !password) {
    console.warn(
      "SEED_ADMIN_NAME / SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD not set — skipping bootstrap admin creation."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.staffUser.create({
    data: { name, phone, passwordHash, role: "ADMIN" },
  });
  console.log(`Created bootstrap admin user "${name}" (${phone}). Change this password after first login.`);
}

/** Sample visits for the patient-portal "fill" flow on the demo site. */
async function seedDemoPatientBookings(testIdByName: Map<string, string>) {
  if (siteConfig.payment.provider !== "demo") {
    console.log("Payment provider is not demo — skipping demo patient bookings.");
    return;
  }

  const cbcId = testIdByName.get("Complete Blood Count (CBC)");
  const lipidId = testIdByName.get("Lipid Profile");
  const packageId = (
    await db.package.findFirst({
      where: { id: { startsWith: "seed-" } },
      orderBy: { price: "asc" },
      select: { id: true, name: true, price: true },
    })
  );

  if (!cbcId || !lipidId || !packageId) {
    console.warn("Catalog incomplete — skipping demo patient bookings.");
    return;
  }

  const branchId = siteConfig.branches.find((branch) => branch.isMain)?.id ?? null;
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const demos = [
    {
      id: "seed-demo-booking-ready",
      referenceCode: "DEMO-READY",
      status: "REPORT_READY" as const,
      paymentStatus: "PAID" as const,
      paymentMethod: "ONLINE" as const,
      preferredDate: tomorrow,
      preferredTime: "09:00-10:00",
      estimatedTotal: 450,
      items: [
        { testId: cbcId, nameSnapshot: "Complete Blood Count (CBC)", priceSnapshot: 450 },
      ],
    },
    {
      id: "seed-demo-booking-active",
      referenceCode: "DEMO-ACTIVE",
      status: "PROCESSING" as const,
      paymentStatus: "UNPAID" as const,
      paymentMethod: "CASH" as const,
      preferredDate: tomorrow,
      preferredTime: "10:00-11:00",
      estimatedTotal: Number(packageId.price),
      items: [
        {
          packageId: packageId.id,
          nameSnapshot: packageId.name,
          priceSnapshot: Number(packageId.price),
        },
      ],
    },
    {
      id: "seed-demo-booking-pending",
      referenceCode: "DEMO-PENDING",
      status: "CONFIRMED" as const,
      paymentStatus: "UNPAID" as const,
      paymentMethod: "CASH" as const,
      preferredDate: tomorrow,
      preferredTime: "11:00-12:00",
      estimatedTotal: 1200,
      items: [
        { testId: lipidId, nameSnapshot: "Lipid Profile", priceSnapshot: 1200 },
      ],
    },
  ];

  for (const demo of demos) {
    await db.booking.upsert({
      where: { id: demo.id },
      update: {
        patientName: DEV_SAMPLE.patientName,
        phone: DEV_SAMPLE.phone,
        age: Number(DEV_SAMPLE.age),
        gender: "OTHER",
        collectionType: "IN_CENTER",
        address: null,
        branchId,
        preferredDate: demo.preferredDate,
        preferredTime: demo.preferredTime,
        notes: DEV_SAMPLE.notes,
        status: demo.status,
        estimatedTotal: demo.estimatedTotal,
        paymentStatus: demo.paymentStatus,
        paymentMethod: demo.paymentMethod,
        items: {
          deleteMany: {},
          create: demo.items,
        },
      },
      create: {
        id: demo.id,
        referenceCode: demo.referenceCode,
        patientName: DEV_SAMPLE.patientName,
        phone: DEV_SAMPLE.phone,
        age: Number(DEV_SAMPLE.age),
        gender: "OTHER",
        collectionType: "IN_CENTER",
        branchId,
        preferredDate: demo.preferredDate,
        preferredTime: demo.preferredTime,
        notes: DEV_SAMPLE.notes,
        status: demo.status,
        estimatedTotal: demo.estimatedTotal,
        paymentStatus: demo.paymentStatus,
        paymentMethod: demo.paymentMethod,
        items: { create: demo.items },
      },
    });
  }

  console.log(
    `Seeded ${demos.length} demo patient bookings for ${DEV_SAMPLE.phone} (patient portal demo).`
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await seedBranches();
  const testIdByName = await seedCategoriesAndTests();
  await seedPackages(testIdByName);
  await seedDoctors();
  await seedAdminUser();
  await seedDemoPatientBookings(testIdByName);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
