"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters, type Filters } from "@/components/shop/ShopFilters";
import type { Product } from "@/generated/prisma/browser";

type ShopClientProps = {
  products: Product[];
  phoneRaw: string;
};

export function ShopClient({ products, phoneRaw }: ShopClientProps) {
  const [filters, setFilters] = useState<Filters>({
    brand: "",
    size: "",
    type: "",
    category: "",
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.size && p.size !== filters.size) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.category && p.category !== filters.category) return false;
      return true;
    });
  }, [products, filters]);

  return (
    <>
      <ShopFilters products={products} filters={filters} onChange={setFilters} />
      {filtered.length === 0 ? (
        <p className="text-center text-metallic">No products match your filters. Call us for availability.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} phoneRaw={phoneRaw} />
          ))}
        </div>
      )}
    </>
  );
}