import { NextResponse } from "next/server";
import { getVehicleMakesForYear, getVehicleModelsForYearMake } from "@/lib/vehicle-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const make = url.searchParams.get("make") || "";

    if (!year) {
      return NextResponse.json({ makes: [], models: [] });
    }

    if (make) {
      const models = await getVehicleModelsForYearMake(year, make);
      return NextResponse.json(
        { models },
        { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
      );
    }

    const makes = await getVehicleMakesForYear(year);
    return NextResponse.json(
      { makes },
      { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Vehicle data could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
