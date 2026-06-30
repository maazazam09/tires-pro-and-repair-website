import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: ".env.local", override: true });

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

process.env.DATABASE_URL = process.env.TURSO_DATABASE_URL;

execSync("npx prisma db push", { stdio: "inherit", env: process.env });