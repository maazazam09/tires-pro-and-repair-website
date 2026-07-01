import { Phone } from "lucide-react";
import type { Product } from "@/generated/prisma/browser";

type ProductCardProps = {
  product: Product;
  phoneRaw: string;
};

export function ProductCard({ product, phoneRaw }: ProductCardProps) {
  const isBrandLogo =
    (product.category === "TIRE" && product.imageUrl.includes("/uploads/tires/logos/")) ||
    (product.category === "WHEEL" && product.imageUrl.includes("/uploads/wheels/logos/"));
  const imageClassName = isBrandLogo
    ? "h-full w-full rounded-md bg-white object-contain p-5"
    : "h-full w-full rounded-md object-cover";

  return (
    <div className="card flex flex-col">
      <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-[#F3F4F6]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className={imageClassName} />
        ) : (
          <span className="text-4xl text-border">🛞</span>
        )}
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">{product.type}</span>
        <span className="rounded bg-black/5 px-2 py-0.5 text-xs text-metallic">{product.category}</span>
      </div>
      <h3 className="font-display break-words text-base font-bold text-foreground sm:text-lg">{product.name}</h3>
      <p className="mt-1 break-words text-sm text-metallic">
        {product.brand} · {product.size}
      </p>
      <div className="mt-auto pt-4">
        <a href={`tel:${phoneRaw}`} className="btn-primary w-full justify-center text-sm sm:text-xs">
          <Phone className="h-3 w-3" />
          Call to Inquire
        </a>
      </div>
    </div>
  );
}
