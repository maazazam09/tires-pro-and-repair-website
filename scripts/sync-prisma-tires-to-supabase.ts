import { prisma } from "@/lib/prisma";
import { getRuntimeEnv } from "@/lib/runtime-env";

type SupabaseTireInsert = {
  brand: string;
  model_name: string;
  tire_size: string;
  image_url: string;
  description: string;
  in_stock: boolean;
  rim_diameter: number | null;
};

function rimDiameterFromSize(size: string) {
  const match = size.toUpperCase().match(/R(\d{2})/);
  return match ? Number(match[1]) : null;
}

async function main() {
  const supabaseUrl = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") || getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !key) throw new Error("Supabase env values are missing.");

  const products = await prisma.product.findMany({
    where: { category: "TIRE", active: true },
    include: { tireDetail: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: SupabaseTireInsert[] = products
    .filter((product) => product.size.trim())
    .map((product) => ({
      brand: product.brand.trim() || "Unknown",
      model_name: product.tireDetail?.model?.trim() || product.name.trim(),
      tire_size: product.tireDetail?.tireSize?.trim() || product.size.trim(),
      image_url: product.imageUrl || "",
      description: product.description || "",
      in_stock: true,
      rim_diameter: product.tireDetail?.rimDiameter || rimDiameterFromSize(product.size),
    }));

  if (rows.length === 0) {
    console.log(JSON.stringify({ inserted: 0, message: "No active local tire products found." }, null, 2));
    return;
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/tires`;
  const existingEndpoint = new URL(endpoint);
  existingEndpoint.searchParams.set("select", "brand,model_name,tire_size");
  const existingResponse = await fetch(existingEndpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const existingRows = existingResponse.ok
    ? await existingResponse.json() as Array<Pick<SupabaseTireInsert, "brand" | "model_name" | "tire_size">>
    : [];
  const existingKeys = new Set(
    existingRows.map((row) => `${row.brand}::${row.model_name}::${row.tire_size}`.toLowerCase()),
  );
  const rowsToInsert = rows.filter(
    (row) => !existingKeys.has(`${row.brand}::${row.model_name}::${row.tire_size}`.toLowerCase()),
  );

  if (rowsToInsert.length === 0) {
    console.log(JSON.stringify({ inserted: 0, skipped: rows.length, message: "All local tires already exist in Supabase." }, null, 2));
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(rowsToInsert),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase insert failed (${response.status}): ${body}`);
  }

  console.log(JSON.stringify({
    inserted: rowsToInsert.length,
    skipped: rows.length - rowsToInsert.length,
    rows: rowsToInsert.map((row) => ({ brand: row.brand, model_name: row.model_name, tire_size: row.tire_size })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
