import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/data";
import { phoneToRaw } from "@/lib/phone";

type TireDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function textOrNA(value?: string | null) {
  return value?.trim() || "N/A";
}

function isValidVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default async function TireDetailPage({ params }: TireDetailPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        tireDetail: true,
        tireSizes: { include: { tireSize: true } },
      },
    }),
    getSiteSettings(),
  ]);

  if (!product || product.category !== "TIRE" || !product.active) notFound();

  const detail = product.tireDetail;
  const phoneRaw = phoneToRaw(settings.phone);
  const videoUrl = detail?.videoUrl && isValidVideoUrl(detail.videoUrl) ? detail.videoUrl : "";
  const displayName = detail?.model?.trim() || product.name;

  return (
    <>
      <PageHeader title={product.brand} subtitle={displayName} />
      <section className="py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="card">
            <div className="flex h-72 items-center justify-center rounded-md bg-[#F3F4F6]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={`${product.brand} ${displayName}`} className="h-full w-full rounded-md object-contain p-4" />
              ) : (
                <span className="text-sm font-semibold text-metallic">No image</span>
              )}
            </div>
          </div>
          <div className="card">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">Call for Price</span>
              {detail?.promotionAvailable && detail.promotionText.trim() ? (
                <span className="rounded bg-black/5 px-2 py-0.5 text-xs text-metallic">Promotion Available</span>
              ) : null}
            </div>
            <h2 className="font-display text-3xl font-bold uppercase text-foreground">{product.brand}</h2>
            <p className="mt-2 text-lg font-semibold text-metallic">{displayName}</p>
            <p className="mt-4 text-sm leading-6 text-metallic">{product.description || "Call us to confirm live availability and fitment."}</p>

            <dl className="mt-6 grid gap-3 text-sm text-metallic sm:grid-cols-2">
              <div><dt className="font-semibold text-foreground">SKU</dt><dd>{textOrNA(detail?.sku)}</dd></div>
              <div><dt className="font-semibold text-foreground">Tire Size</dt><dd>{detail?.tireSize || product.size}</dd></div>
              <div><dt className="font-semibold text-foreground">Warranty</dt><dd>{detail?.warrantyText || (detail?.warrantyMiles ? `${detail.warrantyMiles.toLocaleString()} miles` : "N/A")}</dd></div>
              <div><dt className="font-semibold text-foreground">Service Description</dt><dd>{textOrNA(detail?.serviceDescription)}</dd></div>
              <div><dt className="font-semibold text-foreground">Load / Speed</dt><dd>{`${detail?.loadIndex || ""}${detail?.speedRating || ""}`.trim() || "N/A"}</dd></div>
              <div><dt className="font-semibold text-foreground">Season</dt><dd>{detail?.season?.trim() || "Not specified"}</dd></div>
            </dl>

            {detail?.promotionAvailable && detail.promotionText.trim() ? (
              <p className="mt-6 rounded border border-accent/30 bg-accent/10 p-3 text-sm font-semibold text-foreground">
                {detail.promotionText}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?quote=tires#booking" className="btn-primary min-h-12 justify-center text-sm">
                Request a Quote
              </Link>
              <a href={`tel:${phoneRaw}`} className="btn-secondary min-h-12 justify-center text-sm">
                Call for Price
              </a>
              {videoUrl ? (
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-12 justify-center text-sm">
                  <Play className="h-4 w-4" />
                  Watch Video
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
