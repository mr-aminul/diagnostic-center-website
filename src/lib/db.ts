import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaHash?: string;
};

// Include model list so adding PhoneOtp (etc.) invalidates the HMR-cached client.
const schemaHash = Prisma.dmmf.datamodel.models
  .map((model) => `${model.name}:${model.fields.map((field) => field.name).join(",")}`)
  .join("|");

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
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
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
