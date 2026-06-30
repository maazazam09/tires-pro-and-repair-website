import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local", override: true });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  console.log("tables", tables.rows.map((r) => r.name));
  const products = await client.execute("SELECT COUNT(*) as count FROM Product");
  console.log("product_count", products.rows[0]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});