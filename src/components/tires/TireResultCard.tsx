import Link from "next/link";
import { Play, Tag } from "lucide-react";

type TireResultCardProps = {
  product: {
    slug: string;
    name: string;
    brand: string;
    imageUrl: string;
    tireDetail: {
      model: string;
      sku: string;
      warrantyMiles: number | null;
      warrantyText: string;
      serviceDescription: string;
      loadIndex: string;
      speedRating: string;
      season: string;
      videoUrl: string;
      promotionAvailable: boolean;
      promotionText: string;
      requestQuoteEnabled: boolean;
    } | null;
  };
  quoteHref: string;
};

function textOrNA(value?: string | null) {
  return value?.trim() || "N/A";
}

function warrantyText(detail: TireResultCardProps["product"]["tireDetail"]) {
  if (!detail) return "N/A";
  if (detail.warrantyText.trim()) return detail.warrantyText;
  if (detail.warrantyMiles) return `${detail.warrantyMiles.toLocaleString()} miles`;
  return "N/A";
}

function serviceText(detail: TireResultCardProps["product"]["tireDetail"]) {
  if (!detail) return "N/A";
  const loadSpeed = `${detail.loadIndex || ""}${detail.speedRating || ""}`.trim();
  if (detail.serviceDescription.trim() && loadSpeed) return `${detail.serviceDescription} (${loadSpeed})`;
  return detail.serviceDescription.trim() || loadSpeed || "N/A";
}

export function TireResultCard({ product, quoteHref }: TireResultCardProps) {
  const detail = product.tireDetail;
  const displayName = detail?.model?.trim() || product.name;
  const isBrandLogo = product.imageUrl.includes("/uploads/tires/logos/");
  const imageClassName = isBrandLogo
    ? "h-full w-full rounded-md bg-white object-contain p-5"
    : "h-full w-full rounded-md object-cover";

  return (
    <article className="card flex flex-col">
      <div className="mb-4 flex h-44 items-center justify-center rounded-md bg-[#F3F4F6]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={`${product.brand} ${displayName}`} className={imageClassName} loading="lazy" />
        ) : (
          <span className="text-sm font-semibold text-metallic">No image</span>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">Call for Price</span>
        {detail?.promotionAvailable && detail.promotionText.trim() ? (
          <span className="inline-flex items-center gap-1 rounded bg-black/5 px-2 py-0.5 text-xs text-metallic">
            <Tag className="h-3 w-3" />
            Promotion Available
          </span>
        ) : null}
      </div>

      <h3 className="font-display break-words text-lg font-bold text-foreground">{product.brand}</h3>
      <p className="mt-1 break-words text-sm font-semibold text-metallic">{displayName}</p>

      <dl className="mt-4 grid gap-2 text-sm text-metallic">
        <div className="flex justify-between gap-3">
          <dt>SKU</dt>
          <dd className="text-right text-foreground">{textOrNA(detail?.sku)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Warranty</dt>
          <dd className="text-right text-foreground">{warrantyText(detail)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Service</dt>
          <dd className="text-right text-foreground">{serviceText(detail)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Season</dt>
          <dd className="text-right text-foreground">{detail?.season?.trim() || "Not specified"}</dd>
        </div>
      </dl>

      {detail?.promotionAvailable && detail.promotionText.trim() ? (
        <p className="mt-4 rounded border border-accent/30 bg-accent/10 p-3 text-sm font-semibold text-foreground">
          {detail.promotionText}
        </p>
      ) : null}

      <div className="mt-auto grid gap-2 pt-5">
        {detail?.requestQuoteEnabled !== false ? (
          <Link href={quoteHref} className="btn-primary min-h-12 w-full justify-center text-sm">
            Request a Quote
          </Link>
        ) : null}
        <Link href={`/tires/${product.slug}`} className="btn-secondary min-h-11 justify-center text-sm">
          View Details
        </Link>
        {detail?.videoUrl ? (
          <a
            href={detail.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary min-h-11 justify-center text-sm"
          >
            <Play className="h-4 w-4" />
            Watch Video
          </a>
        ) : null}
      </div>
    </article>
  );
}
