import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma ORM 7 moved CLI/migration database configuration out of
// schema.prisma and into this file. The runtime PrismaClient (src/lib/db.ts)
// configures its own driver adapter separately.
//
// `prisma generate` (postinstall / Vercel build) must not hard-fail when
// DATABASE_URL is unset yet — use a placeholder. Real migrate/seed still
// require a valid DATABASE_URL at runtime.
const datasourceUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
