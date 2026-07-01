"use client";

import type { Product } from "@/generated/prisma/browser";

export type Filters = {
  brand: string;
  size: string;
  type: string;
  category: string;
};

type ShopFiltersProps = {
  products: Product[];
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function ShopFilters({ products, filters, onChange }: ShopFiltersProps) {
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  const sizes = [...new Set(products.map((p) => p.size))].sort();

  return (
    <div className="card mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs text-metallic">Brand</label>
        <select
          value={filters.brand}
          onChange={(e) => onChange({ ...filters, brand: e.target.value })}
          className="w-full min-h-11 rounded border border-border bg-white px-3 py-3 text-base text-foreground sm:py-2 sm:text-sm"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-metallic">Size</label>
        <select
          value={filters.size}
          onChange={(e) => onChange({ ...filters, size: e.target.value })}
          className="w-full min-h-11 rounded border border-border bg-white px-3 py-3 text-base text-foreground sm:py-2 sm:text-sm"
        >
          <option value="">All Sizes</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-metallic">Type</label>
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          className="w-full min-h-11 rounded border border-border bg-white px-3 py-3 text-base text-foreground sm:py-2 sm:text-sm"
        >
          <option value="">New & Used</option>
          <option value="NEW">New</option>
          <option value="USED">Used</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-metallic">Category</label>
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full min-h-11 rounded border border-border bg-white px-3 py-3 text-base text-foreground sm:py-2 sm:text-sm"
        >
          <option value="">All</option>
          <option value="TIRE">Tires</option>
          <option value="WHEEL">Wheels</option>
          <option value="PACKAGE">Packages</option>
        </select>
      </div>
    </div>
  );
}
