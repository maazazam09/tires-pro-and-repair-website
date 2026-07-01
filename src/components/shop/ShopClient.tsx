"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters, type Filters } from "@/components/shop/ShopFilters";
import type { Product } from "@/generated/prisma/browser";

type ShopClientProps = {
  products: Product[];
  phoneRaw: string;
  showFilters?: boolean;
};

export function ShopClient({ products, phoneRaw, showFilters = true }: ShopClientProps) {
  const [filters, setFilters] = useState<Filters>({
    brand: "",
    size: "",
    type: "",
    category: "",
  });

  const filtered = useMemo(() => {
    if (!showFilters) return products;

    return products.filter((p) => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.size && p.size !== filters.size) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.category && p.category !== filters.category) return false;
      return true;
    });
  }, [products, filters, showFilters]);

  return (
    <>
      {showFilters ? <ShopFilters products={products} filters={filters} onChange={setFilters} /> : null}
      {filtered.length === 0 ? (
        <p className="text-center text-metallic">No products match your filters. Call us for availability.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} phoneRaw={phoneRaw} />
          ))}
        </div>
      )}
    </>
  );
}
