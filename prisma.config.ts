import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma ORM 7 moved CLI/migration database configuration out of
// schema.prisma and into this file. The runtime PrismaClient (src/lib/db.ts)
// configures its own driver adapter separately.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
