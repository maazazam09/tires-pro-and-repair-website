import Link from "next/link";
import { Phone } from "lucide-react";
import type { Product } from "@/generated/prisma/browser";

type ProductCardProps = {
  product: Product;
  phoneRaw: string;
};

export function ProductCard({ product, phoneRaw }: ProductCardProps) {
  return (
    <div className="card flex flex-col">
      <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-[#F3F4F6]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-md object-cover" />
        ) : (
          <span className="text-4xl text-border">🛞</span>
        )}
      </div>
      <div className="mb-2 flex gap-2">
        <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">{product.type}</span>
        <span className="rounded bg-black/5 px-2 py-0.5 text-xs text-metallic">{product.category}</span>
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{product.name}</h3>
      <p className="mt-1 text-sm text-metallic">
        {product.brand} · {product.size}
      </p>
      <div className="mt-auto pt-4">
        <a href={`tel:${phoneRaw}`} className="btn-primary w-full text-xs justify-center">
          <Phone className="h-3 w-3" />
          Call to Inquire
        </a>
      </div>
    </div>
  );
}
