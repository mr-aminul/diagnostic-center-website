import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaHash?: string;
};

// Include model list so adding PhoneOtp / BookingItem.report (etc.) invalidates the HMR-cached client.
const schemaHash = [
  "v2-item-reports",
  ...Prisma.dmmf.datamodel.models.map(
    (model) => `${model.name}:${model.fields.map((field) => field.name).join(",")}`,
  ),
].join("|");

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Fail fast instead of hanging page renders when Postgres is wedged.
  const url = new URL(connectionString);
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "5");
  }

  // Neon PgBouncer (host contains `-pooler.`) rejects startup params like
  // `statement_timeout`. Use Prisma transaction timeouts instead on Neon.
  // https://neon.tech/docs/connect/connection-errors#unsupported-startup-parameter
  const isNeonPooler = url.hostname.includes("-pooler.");
  if (isNeonPooler) {
    const options = url.searchParams.get("options");
    if (options?.includes("statement_timeout")) {
      const cleaned = options
        .replace(/-c\s*statement_timeout=\d+/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned) url.searchParams.set("options", cleaned);
      else url.searchParams.delete("options");
    }
  } else if (!url.searchParams.has("options")) {
    url.searchParams.set("options", "-c statement_timeout=8000");
  }

  const adapter = new PrismaPg({ connectionString: url.toString() });
  return new PrismaClient({
    adapter,
    // Avoid long silent waits that make every soft nav feel broken.
    transactionOptions: { maxWait: 5_000, timeout: 10_000 },
  });
}

function modelDelegateName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function isClientMissingModels(client: PrismaClient): boolean {
  return Prisma.dmmf.datamodel.models.some((model) => {
    const delegate = modelDelegateName(model.name);
    const value = (client as unknown as Record<string, unknown>)[delegate];
    return value == null || typeof (value as { findMany?: unknown }).findMany !== "function";
  });
}

function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const hashMismatch = cached != null && globalForPrisma.prismaSchemaHash !== schemaHash;
  const missingModels = cached != null && isClientMissingModels(cached);

  if (cached && (hashMismatch || missingModels)) {
    void cached.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaSchemaHash = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaHash = schemaHash;
  }

  return globalForPrisma.prisma;
}

/**
 * Always resolve the current Prisma client per access.
 * Avoids Turbopack/HMR keeping a module-level `db` that predates new models
 * (e.g. `phoneOtp` after `prisma migrate` / `prisma generate`).
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    let client = getClient();
    let value = Reflect.get(client, property, client);

    // Turbopack/HMR can keep a PrismaClient instance that predates `prisma generate`
    // even after DMMF updates. If a known model delegate is missing, force one rebuild.
    if (
      typeof property === "string" &&
      (value == null || typeof (value as { findMany?: unknown }).findMany !== "function") &&
      Prisma.dmmf.datamodel.models.some(
        (model) => modelDelegateName(model.name) === property,
      )
    ) {
      void client.$disconnect().catch(() => undefined);
      globalForPrisma.prisma = undefined;
      globalForPrisma.prismaSchemaHash = undefined;
      client = getClient();
      value = Reflect.get(client, property, client);
    }

    return typeof value === "function" ? value.bind(client) : value;
  },
});
