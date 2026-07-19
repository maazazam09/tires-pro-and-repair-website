import { getSupabaseTiresBySize, type SupabaseTire } from "@/lib/supabase-tire-inventory";
import { normalizeTireSize, searchWheelSizeByModel, type WheelSizeResult } from "@/lib/wheel-size";

export type TireFinderSearchOutcome = "matches" | "valid_no_inventory" | "no_fitment" | "error";

export type TireFinderSearchResult = {
  outcome: TireFinderSearchOutcome;
  vehicle: {
    year: number;
    make: string;
    model: string;
    tireSize: string;
  };
  fitment: WheelSizeResult;
  matchingSizes: string[];
  tires: SupabaseTire[];
  message: string;
};

export async function searchTiresForVehicle({
  year,
  make,
  model,
  tireSize,
}: {
  year: number;
  make: string;
  model: string;
  tireSize: string;
}): Promise<TireFinderSearchResult> {
  const fitment = await searchWheelSizeByModel({ year, make, model, region: "usdm" });
  const vehicle = { year, make, model, tireSize };

  if (!fitment.ok) {
    return {
      outcome: fitment.code === "no_results" ? "no_fitment" : "error",
      vehicle,
      fitment,
      matchingSizes: [],
      tires: [],
      message: fitment.code === "no_results"
        ? "We couldn't find fitment data for this vehicle, please call us."
        : fitment.message,
    };
  }

  const selectedSize = normalizeTireSize(tireSize);
  const matchingSizes = fitment.sizes.filter((size) => normalizeTireSize(size) === selectedSize);

  if (matchingSizes.length === 0) {
    return {
      outcome: "no_fitment",
      vehicle,
      fitment,
      matchingSizes: [],
      tires: [],
      message: "We couldn't find fitment data for this vehicle and tire size, please call us.",
    };
  }

  const tires = await getSupabaseTiresBySize(tireSize);
  if (tires.length === 0) {
    return {
      outcome: "valid_no_inventory",
      vehicle,
      fitment,
      matchingSizes,
      tires,
      message: "We don't have this exact tire listed online - call us and we'll help you find the right fit.",
    };
  }

  return {
    outcome: "matches",
    vehicle,
    fitment,
    matchingSizes,
    tires,
    message: `${tires.length} matching tire${tires.length === 1 ? "" : "s"} found in our inventory.`,
  };
}
