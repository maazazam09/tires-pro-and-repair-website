import { NextResponse } from "next/server";
import { searchWheelSizeByModel } from "@/lib/wheel-size";

export async function GET() {
  const result = await searchWheelSizeByModel({
    year: 2022,
    make: "honda",
    model: "civic",
    region: "usdm",
  });

  return NextResponse.json(
    {
      ok: result.ok,
      cached: result.cached,
      source: result.source,
      sizesFound: result.ok ? result.sizes.length : 0,
      error: result.ok ? null : { code: result.code, message: result.message, status: result.status },
    },
    { status: result.ok ? 200 : 503 },
  );
}
