"use client";

import { useEffect, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

type Facets = {
  brands: string[];
  seasons: string[];
  warrantyRanges: Array<{ value: string; label: string }>;
  speedRatings: string[];
  hasPromotion: boolean;
  hasWarranty: boolean;
};

type Filters = {
  brand?: string;
  season?: string;
  warranty?: string;
  speedRating?: string;
  promotion?: string;
  sort?: string;
};

type BaseParams = {
  year?: string;
  make?: string;
  model?: string;
  size?: string;
};

const inputClass = "min-h-11 w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";
const labelClass = "mb-1 block text-xs font-semibold uppercase text-metallic";

function buildHref(base: BaseParams, filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return `/tires/results?${params.toString()}`;
}

function activeFilterLabels(filters: Filters, facets: Facets) {
  const labels: Array<{ key: keyof Filters; label: string }> = [];
  if (filters.brand) labels.push({ key: "brand", label: `Brand: ${filters.brand}` });
  if (filters.season) labels.push({ key: "season", label: `Season: ${filters.season}` });
  if (filters.warranty) {
    labels.push({
      key: "warranty",
      label: `Warranty: ${facets.warrantyRanges.find((range) => range.value === filters.warranty)?.label || filters.warranty}`,
    });
  }
  if (filters.speedRating) labels.push({ key: "speedRating", label: `Speed: ${filters.speedRating}` });
  if (filters.promotion === "1") labels.push({ key: "promotion", label: "Promotion Available" });
  if (filters.sort) labels.push({ key: "sort", label: `Sort: ${sortLabel(filters.sort)}` });
  return labels;
}

function sortLabel(value: string) {
  if (value === "brand-asc") return "Brand A-Z";
  if (value === "brand-desc") return "Brand Z-A";
  if (value === "model-asc") return "Tire Model A-Z";
  if (value === "warranty-desc") return "Warranty High to Low";
  if (value === "newest") return "Newest Listed";
  return "Recommended";
}

export function TireResultsFilters({
  facets,
  filters,
  baseParams,
  resultCount,
}: {
  facets: Facets;
  filters: Filters;
  baseParams: BaseParams;
  resultCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const clearHref = buildHref(baseParams, {});
  const activeLabels = activeFilterLabels(filters, facets);

  useEffect(() => {
    const nextFilters = filters;
    queueMicrotask(() => setDraft(nextFilters));
  }, [filters]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function apply(nextDraft = draft) {
    setOpen(false);
    router.push(buildHref(baseParams, nextDraft));
  }

  function clear() {
    setDraft({});
    setOpen(false);
    router.push(clearHref);
  }

  return (
    <>
      <div className="mb-6 lg:hidden">
        <button type="button" className="btn-secondary min-h-12 w-full justify-center text-sm" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filter & Sort
        </button>
      </div>

      <aside className="hidden lg:block">
        <FilterPanel
          facets={facets}
          draft={draft}
          setDraft={setDraft}
          resultCount={resultCount}
          onApply={apply}
          onClear={clear}
        />
      </aside>

      {activeLabels.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeLabels.map((chip) => {
            const next = { ...filters, [chip.key]: "" };
            return (
              <button
                key={chip.key}
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded border border-border bg-white px-3 text-sm text-foreground"
                onClick={() => router.push(buildHref(baseParams, next))}
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
          <button type="button" className="min-h-9 text-sm font-semibold text-accent" onClick={clear}>
            Clear Filters
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort tires">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-lg bg-white p-4 shadow-[0_-16px_40px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold uppercase text-foreground">Filter & Sort</h2>
              <button type="button" className="rounded border border-border p-2 text-foreground" onClick={() => setOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              facets={facets}
              draft={draft}
              setDraft={setDraft}
              resultCount={resultCount}
              onApply={apply}
              onClear={clear}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterPanel({
  facets,
  draft,
  setDraft,
  resultCount,
  onApply,
  onClear,
}: {
  facets: Facets;
  draft: Filters;
  setDraft: (filters: Filters) => void;
  resultCount: number;
  onApply: () => void;
  onClear: () => void;
}) {
  const hasWarranty = facets.hasWarranty && facets.warrantyRanges.length > 0;

  return (
    <div className="rounded border border-border bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold uppercase text-foreground">Filter & Sort</h2>
        <p className="mt-1 text-sm text-metallic">{resultCount} exact matching tire{resultCount === 1 ? "" : "s"}</p>
      </div>
      <div className="grid gap-4">
        <FilterSelect
          label="Tire Brand"
          value={draft.brand || ""}
          onChange={(brand) => setDraft({ ...draft, brand })}
          placeholder="All Tire Brands"
          options={facets.brands.map((brand) => ({ value: brand, label: brand }))}
        />
        <FilterSelect
          label="Season"
          value={draft.season || ""}
          onChange={(season) => setDraft({ ...draft, season })}
          placeholder="Any Season"
          options={facets.seasons.map((season) => ({ value: season, label: season }))}
        />
        {hasWarranty ? (
          <FilterSelect
            label="Warranty"
            value={draft.warranty || ""}
            onChange={(warranty) => setDraft({ ...draft, warranty })}
            placeholder="Any Warranty"
            options={facets.warrantyRanges.map((range) => ({ value: range.value, label: range.label }))}
          />
        ) : null}
        <FilterSelect
          label="Speed Rating"
          value={draft.speedRating || ""}
          onChange={(speedRating) => setDraft({ ...draft, speedRating })}
          placeholder="Any Speed Rating"
          options={facets.speedRatings.map((rating) => ({ value: rating, label: rating }))}
        />
        {facets.hasPromotion ? (
          <label className="flex min-h-11 items-center gap-3 rounded border border-border px-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.promotion === "1"}
              onChange={(event) => setDraft({ ...draft, promotion: event.target.checked ? "1" : "" })}
            />
            Promotion Available
          </label>
        ) : null}
        <FilterSelect
          label="Sort"
          value={draft.sort || ""}
          onChange={(sort) => setDraft({ ...draft, sort })}
          placeholder="Recommended"
          options={[
            { value: "brand-asc", label: "Brand A-Z" },
            { value: "brand-desc", label: "Brand Z-A" },
            { value: "model-asc", label: "Tire Model A-Z" },
            ...(hasWarranty ? [{ value: "warranty-desc", label: "Warranty: High to Low" }] : []),
            { value: "newest", label: "Newest Listed" },
          ]}
        />
      </div>
      <div className="mt-5 grid gap-3">
        <button type="button" className="btn-primary min-h-12 w-full justify-center text-sm" onClick={onApply}>
          Apply Filters
        </button>
        <button type="button" className="btn-secondary min-h-12 w-full justify-center text-sm" onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
