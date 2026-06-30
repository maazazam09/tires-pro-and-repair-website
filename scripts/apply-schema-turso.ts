import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local", override: true });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });
const migrationPath = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260623223107_init",
  "migration.sql",
);
const sql = readFileSync(migrationPath, "utf8");
const statements = sql
  .split("\n")
  .filter((line) => !line.startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log("OK", statement.slice(0, 60));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        console.log("SKIP", statement.slice(0, 60));
        continue;
      }
      throw error;
    }
  }
  console.log(`Processed ${statements.length} migration statements on Turso`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});