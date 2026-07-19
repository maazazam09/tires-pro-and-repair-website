import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env" });

if (process.env.npm_lifecycle_event === "build" || process.env.VERCEL === "1") {
  dotenv.config({ path: ".env.production.local", override: true });
  dotenv.config({ path: ".env.vercel.production", override: true });
}

const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
const schema =
  process.env.PRISMA_PROVIDER === "sqlite"
    ? "prisma/schema.prisma"
    : process.env.PRISMA_PROVIDER === "postgresql"
      ? "prisma/schema.postgresql.prisma"
      :
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://")
    ? "prisma/schema.postgresql.prisma"
    : "prisma/schema.prisma";

export default defineConfig({
  schema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
