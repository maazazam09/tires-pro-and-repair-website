import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveSqlitePath(databaseUrl: string) {
  const relativeOrAbsolute = databaseUrl.replace(/^file:/, "");
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(process.cwd(), relativeOrAbsolute);
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (tursoUrl && tursoToken) {
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter });
  }

  if (
    databaseUrl.startsWith("libsql://") ||
    databaseUrl.startsWith("https://") ||
    databaseUrl.startsWith("http://")
  ) {
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error("TURSO_AUTH_TOKEN is required when DATABASE_URL points to a Turso/libSQL database.");
    }
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url: databaseUrl, authToken });
    return new PrismaClient({ adapter });
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    return new PrismaClient({ adapter });
  }

  if (databaseUrl.startsWith("file:")) {
    if (process.env.VERCEL === "1") {
      throw new Error(
        "SQLite file databases are read-only on Vercel. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production writes.",
      );
    }
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: resolveSqlitePath(databaseUrl) });
    return new PrismaClient({ adapter });
  }

  throw new Error(
    "Configure TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, a PostgreSQL DATABASE_URL, or a local SQLite file URL.",
  );
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}