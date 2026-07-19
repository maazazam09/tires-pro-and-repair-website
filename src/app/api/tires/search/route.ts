import { NextResponse } from "next/server";
import { searchTiresForVehicle } from "@/lib/tire-finder-search";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";
    const tireSize = url.searchParams.get("tireSize") || url.searchParams.get("size") || "";

    if (!year || !make || !model || !tireSize) {
      return NextResponse.json(
        { error: "year, make, model, and tireSize are required." },
        { status: 400 },
      );
    }

    const result = await searchTiresForVehicle({ year, make, model, tireSize });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tire search failed." },
      { status: 500 },
    );
  }
}
