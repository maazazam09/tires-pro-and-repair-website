import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createVehicleFitment,
  deleteVehicleFitment,
  getFitmentTireResults,
  getVehicleFitmentById,
  listVehicleFitments,
  updateVehicleFitment,
} from "@/lib/tires";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      const fitment = await getVehicleFitmentById(id);
      if (!fitment) return NextResponse.json({ error: "Fitment not found" }, { status: 404 });
      return NextResponse.json({ fitment });
    }

    const list = url.searchParams.get("list");
    if (list === "1") {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;

      const yearParam = url.searchParams.get("year");
      const fitments = await listVehicleFitments({
        search: url.searchParams.get("search") || undefined,
        year: yearParam ? Number(yearParam) : undefined,
        make: url.searchParams.get("make") || undefined,
        model: url.searchParams.get("model") || undefined,
        tireSize: url.searchParams.get("tireSize") || undefined,
      });
      return NextResponse.json({ fitments });
    }

    const year = Number(url.searchParams.get("year"));
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";
    const option = url.searchParams.get("option") || "";

    if (!year || !make.trim() || !model.trim() || !option.trim()) {
      return NextResponse.json(
        { error: "year, make, model, and option are required" },
        { status: 400 },
      );
    }

    const result = await getFitmentTireResults({ year, make, model, option });
    if (!result) return NextResponse.json({ fitment: null, results: null });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve tire fitment" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const fitment = await createVehicleFitment(payload);
    return NextResponse.json({ fitment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create tire fitment" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const fitment = await updateVehicleFitment(payload);
    return NextResponse.json({ fitment });
  } catch (error) {
    console.error("Failed to update tire fitment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tire fitment" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Fitment id is required" }, { status: 400 });
    await deleteVehicleFitment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tire fitment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete tire fitment" },
      { status: 400 },
    );
  }
}
