import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local", override: true });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "CollectionSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "itemName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CollectionSection_key_key" ON "CollectionSection"("key")`,
  `ALTER TABLE "FormSubmission" ADD COLUMN "service" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "FormSubmission" ADD COLUMN "preferredDate" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "FormSubmission" ADD COLUMN "preferredTime" TEXT NOT NULL DEFAULT ''`,
];

async function main() {
  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log("OK", statement.slice(0, 70));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("duplicate column") || message.includes("already exists")) {
        console.log("SKIP", statement.slice(0, 70));
        continue;
      }
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});