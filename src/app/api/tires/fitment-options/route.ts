import { NextResponse } from "next/server";
import { getTireFinderOptions } from "@/lib/tires";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const options = await getTireFinderOptions({
      year: yearParam ? Number(yearParam) : undefined,
      make: url.searchParams.get("make") || undefined,
      model: url.searchParams.get("model") || undefined,
      option: url.searchParams.get("option") || undefined,
    });

    return NextResponse.json(options, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tire finder options" },
      { status: 400 },
    );
  }
}
