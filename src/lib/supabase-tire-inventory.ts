import { getRuntimeEnv } from "@/lib/runtime-env";
import { normalizeTireSize } from "@/lib/wheel-size";

export type SupabaseTire = {
  id: string;
  brand: string;
  model_name: string;
  tire_size: string;
  image_url: string;
  description: string;
  in_stock: boolean;
  rim_diameter: number | null;
  created_at: string;
};

function supabaseHeaders() {
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") || getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function getSupabaseTiresBySize(tireSize: string) {
  const supabaseUrl = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") || getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !key) {
    throw new Error("Supabase tire inventory credentials are not configured.");
  }

  const url = new URL(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/tires`);
  url.searchParams.set("select", "id,brand,model_name,tire_size,image_url,description,in_stock,rim_diameter,created_at");
  url.searchParams.set("in_stock", "eq.true");
  url.searchParams.set("order", "brand.asc,model_name.asc");

  const response = await fetch(url, {
    headers: supabaseHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Supabase tire inventory request failed.");
  }

  const tires = await response.json() as SupabaseTire[];
  const selected = normalizeTireSize(tireSize);
  return tires.filter((tire) => normalizeTireSize(tire.tire_size) === selected);
}
