import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { CallToInquireButton } from "@/components/shared/CallToInquireButton";
import { SupabaseTireCard } from "@/components/tires/SupabaseTireCard";
import { searchTiresForVehicle } from "@/lib/tire-finder-search";

type TireResultsPageProps = {
  searchParams: Promise<{
    year?: string;
    make?: string;
    model?: string;
    size?: string;
    tireSize?: string;
  }>;
};

function buildHref(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return `${path}?${query.toString()}`;
}

function selectedSizeLabel(size?: string) {
  if (!size) return "";
  return decodeURIComponent(size)
    .replace(/^front-/i, "Front ")
    .replace(/_rear-/i, " / Rear ")
    .replace(/-/g, "/")
    .replace(/\/R\//g, "R")
    .replace(/\/ZR\//g, "ZR");
}

export default async function TireResultsPage({ searchParams }: TireResultsPageProps) {
  const params = await searchParams;
  const tireSize = params.tireSize || params.size || "";
  const vehicleComplete = Boolean(params.year && params.make && params.model && tireSize);
  const changeVehicleHref = buildHref("/collections/tires", {
    year: params.year,
    make: params.make,
    model: params.model,
    size: tireSize,
  });
  const vehicleName = `${params.year || ""} ${params.make || ""} ${params.model || ""}`.trim();
  const readableSize = selectedSizeLabel(tireSize);

  const result = vehicleComplete
    ? await searchTiresForVehicle({
        year: Number(params.year),
        make: params.make || "",
        model: params.model || "",
        tireSize,
      }).catch((error) => ({
        outcome: "error" as const,
        vehicle: {
          year: Number(params.year),
          make: params.make || "",
          model: params.model || "",
          tireSize,
        },
        fitment: {
          ok: false as const,
          source: "wheel-size" as const,
          cached: false,
          code: "unknown" as const,
          message: error instanceof Error ? error.message : "Tire search failed.",
        },
        matchingSizes: [],
        tires: [],
        message: error instanceof Error ? error.message : "Tire search failed.",
      }))
    : null;

  const title = result?.outcome === "matches"
    ? `${result.tires.length} Matching Tire${result.tires.length === 1 ? "" : "s"}`
    : "Tire Finder Results";

  return (
    <>
      <PageHeader title="Tire Finder Results" subtitle="Verified fitment with Tire Pro & Repair inventory" />
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 border-l-4 border-accent bg-white px-4 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:mb-8 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase leading-tight text-foreground sm:text-3xl">
                  {vehicleComplete ? title : "Select Your Vehicle"}
                </h2>
                {vehicleComplete ? (
                  <dl className="mt-4 grid gap-2 text-sm text-metallic sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="font-semibold text-foreground">Vehicle</dt><dd>{vehicleName}</dd></div>
                    <div><dt className="font-semibold text-foreground">Tire Size</dt><dd>{readableSize}</dd></div>
                    <div><dt className="font-semibold text-foreground">Inventory</dt><dd>{result?.tires.length || 0} match{result?.tires.length === 1 ? "" : "es"}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-metallic sm:text-base">
                    Choose year, make, model, and tire size to search available tires.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href={changeVehicleHref} className="btn-secondary min-h-11 justify-center text-sm">
                  Back to Vehicle Selection
                </Link>
                <Link href="/collections/tires" className="btn-secondary min-h-11 justify-center text-sm">
                  New Search
                </Link>
              </div>
            </div>
          </div>

          {!vehicleComplete ? (
            <ResultMessage message="Please complete all four Tire Finder selections before searching." />
          ) : result?.outcome === "matches" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {result.tires.map((tire) => (
                <SupabaseTireCard key={tire.id} tire={tire} />
              ))}
            </div>
          ) : (
            <ResultMessage message={result?.message || "Tire search failed."} />
          )}
        </div>
      </section>
    </>
  );
}

function ResultMessage({ message }: { message: string }) {
  return (
    <div className="border-l-4 border-accent bg-white px-4 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:px-6 sm:py-6">
      <h2 className="font-display text-2xl font-bold uppercase text-foreground">Call to Confirm Fitment</h2>
      <p className="mt-2 text-sm leading-6 text-metallic sm:text-base">{message}</p>
      <CallToInquireButton className="mt-6" />
    </div>
  );
}
