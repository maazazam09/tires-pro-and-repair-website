"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SizeOption = {
  value: string;
  label: string;
  type: "square" | "staggered";
  front: string;
  rear: string;
};

type FinderOptions = {
  years: number[];
  makes: string[];
  models: string[];
  sizes: SizeOption[];
  sizeLookupFailed?: boolean;
};

type Selection = {
  year: string;
  make: string;
  model: string;
  size: string;
};

const finderYears = Array.from({ length: 27 }, (_, index) => 2026 - index);

const emptyOptions: FinderOptions = {
  years: finderYears,
  makes: [],
  models: [],
  sizes: [],
};

const emptySelection: Selection = {
  year: "",
  make: "",
  model: "",
  size: "",
};

const selectClass =
  "min-h-12 w-full rounded border border-border bg-white px-3 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-metallic sm:text-sm";

function fitmentOptionUrl(selection: Partial<Selection>) {
  const params = new URLSearchParams();
  if (selection.year) params.set("year", selection.year);
  if (selection.make) params.set("make", selection.make);
  if (selection.model) params.set("model", selection.model);
  return `/api/tires/fitment-options?${params.toString()}`;
}

function resultUrl(selection: Selection) {
  const params = new URLSearchParams({
    year: selection.year,
    make: selection.make,
    model: selection.model,
    size: selection.size,
  });
  return `/tires/results?${params.toString()}`;
}

function sameSelection(a: Selection, b: Selection) {
  return a.year === b.year && a.make === b.make && a.model === b.model && a.size === b.size;
}

function withFinderYears(options: FinderOptions): FinderOptions {
  return {
    ...options,
    years: finderYears,
  };
}

export function TireFinder() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cache = useRef(new Map<string, FinderOptions>());
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [options, setOptions] = useState<FinderOptions>(emptyOptions);
  const [loading, setLoading] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const urlSelection = useMemo<Selection>(() => ({
    year: searchParams.get("year") || "",
    make: searchParams.get("make") || "",
    model: searchParams.get("model") || "",
    size: searchParams.get("size") || "",
  }), [searchParams]);
  const querySelection = useMemo<Selection>(() => ({
    year: selection.year,
    make: selection.make,
    model: selection.model,
    size: "",
  }), [selection.year, selection.make, selection.model]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelection((current) => sameSelection(current, urlSelection) ? current : urlSelection);
    });
  }, [urlSelection]);

  const loadFitmentOptions = useCallback(async (key: string) => {
    const cached = cache.current.get(key);
    if (cached) return cached;
    const data = await fetch(key).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load tire finder options.");
      return body as FinderOptions;
    });
    cache.current.set(key, data);
    return data;
  }, []);

  const loadVehicleOptions = useCallback(async (currentSelection: Selection) => {
    if (!currentSelection.year) return { makes: [], models: [] };
    const makesParams = new URLSearchParams({ year: currentSelection.year });
    const modelsParams = new URLSearchParams({ year: currentSelection.year });
    if (currentSelection.make) modelsParams.set("make", currentSelection.make);

    try {
      if (currentSelection.make) setModelLoading(true);
      const [makesResponse, modelsResponse] = await Promise.all([
        fetch(`/api/vehicle-data?${makesParams.toString()}`),
        currentSelection.make ? fetch(`/api/vehicle-data?${modelsParams.toString()}`) : Promise.resolve(null),
      ]);
      const makesBody = await makesResponse.json();
      if (!makesResponse.ok) throw new Error(makesBody.error || "Vehicle data could not be loaded. Please try again.");

      const modelsBody = modelsResponse ? await modelsResponse.json() : { models: [] };
      if (modelsResponse && !modelsResponse.ok) {
        throw new Error(modelsBody.error || "Vehicle data could not be loaded. Please try again.");
      }

      return {
        makes: Array.isArray(makesBody.makes) ? makesBody.makes as string[] : [],
        models: Array.isArray(modelsBody.models) ? modelsBody.models as string[] : [],
      };
    } finally {
      setModelLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      const key = fitmentOptionUrl(querySelection);
      setLoading(
        querySelection.model
          ? "Loading tire sizes..."
          : querySelection.make
            ? "Loading models..."
            : "Loading vehicle data...",
      );
      setMessage("");

      try {
        const [fitmentData, vehicleData] = await Promise.all([
          loadFitmentOptions(key),
          loadVehicleOptions(querySelection),
        ]);
        if (ignore) return;
        const nextOptions = withFinderYears({
          ...fitmentData,
          makes: querySelection.year ? vehicleData.makes : [],
          models: querySelection.year && querySelection.make ? vehicleData.models : [],
        });
        setOptions(nextOptions);
        setMessage(statusMessage(querySelection, nextOptions));
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Failed network request.");
        }
      } finally {
        if (!ignore) setLoading("");
      }
    }

    loadOptions();
    return () => {
      ignore = true;
    };
  }, [loadFitmentOptions, loadVehicleOptions, querySelection]);

  const selectedSize = useMemo(
    () => options.sizes.find((size) => size.value === selection.size),
    [options.sizes, selection.size],
  );

  const syncUrl = useCallback((nextSelection: Selection, push = false) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(nextSelection)) {
      if (value) params.set(key, value);
    }
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    if (push) {
      router.push(href, { scroll: false });
    } else {
      router.replace(href, { scroll: false });
    }
  }, [pathname, router]);

  const updateSelection = useCallback((patch: Partial<Selection>, push = true) => {
    const next = { ...selection, ...patch };
    setSelection(next);
    syncUrl(next, push);
  }, [selection, syncUrl]);

  function handleChange(field: keyof Selection) {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (field === "year") {
        setOptions((current) => ({ ...current, models: [], sizes: [], sizeLookupFailed: false }));
        updateSelection({ year: value, make: "", model: "", size: "" });
      } else if (field === "make") {
        setOptions((current) => ({ ...current, models: [], sizes: [], sizeLookupFailed: false }));
        updateSelection({ make: value, model: "", size: "" });
      } else if (field === "model") {
        setOptions((current) => ({ ...current, sizes: [], sizeLookupFailed: false }));
        updateSelection({ model: value, size: "" });
      } else {
        updateSelection({ size: value });
      }
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    router.push(resultUrl(selection));
  }

  const canSubmit = Boolean(selection.year && selection.make && selection.model && selection.size && !submitting);
  const isLoadingTireSizes = loading === "Loading tire sizes...";

  return (
    <section
      suppressHydrationWarning
      className="mb-8 border-l-4 border-accent bg-white px-4 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:px-6 sm:py-6"
    >
      <div suppressHydrationWarning className="max-w-4xl">
        <h2 className="font-display text-2xl font-bold uppercase leading-tight text-foreground sm:text-3xl">
          Find Tires for Your Vehicle
        </h2>
        <p className="mt-2 text-sm leading-6 text-metallic sm:text-base">
          Select your vehicle details to see compatible tire sizes and available tires.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-5 lg:items-end">
        <FinderSelect
          label="Year"
          value={selection.year}
          onChange={handleChange("year")}
          disabled={false}
          placeholder="Select Year"
          options={options.years.map((year) => ({ value: String(year), label: String(year) }))}
        />
        <FinderSelect
          label="Make"
          value={selection.make}
          onChange={handleChange("make")}
          disabled={!selection.year}
          placeholder="Select Make"
          options={options.makes.map((make) => ({ value: make, label: make }))}
        />
        <FinderSelect
          label="Model"
          value={selection.model}
          onChange={handleChange("model")}
          disabled={!selection.year || !selection.make}
          placeholder={modelLoading ? "Loading models..." : "Select Model"}
          options={options.models.map((model) => ({ value: model, label: model }))}
        />
        <FinderSelect
          label="Tire Size"
          value={selection.size}
          onChange={handleChange("size")}
          disabled={!selection.year || !selection.make || !selection.model || isLoadingTireSizes}
          placeholder={isLoadingTireSizes ? "Loading tire sizes..." : "Select Tire Size"}
          options={options.sizes.map((size) => ({ value: size.value, label: size.label }))}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary min-h-12 w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Finding Tyres..." : "Find Tyre"}
        </button>
      </form>

      {selectedSize?.type === "staggered" ? (
        <p className="mt-3 text-sm font-semibold text-foreground">
          Staggered fitment: Front {selectedSize.front} | Rear {selectedSize.rear}
        </p>
      ) : null}
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-metallic">
        {loading || message}
      </p>
    </section>
  );
}

function FinderSelect({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  const id = `tire-finder-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div suppressHydrationWarning>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={onChange} disabled={disabled} className={selectClass}>
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

function statusMessage(selection: Selection, options: FinderOptions) {
  if (!selection.year && options.years.length === 0) return "No verified vehicle fitments are available yet. Please call us for assistance.";
  if (selection.year && !selection.make && options.makes.length === 0) return "No makes available for the selected year.";
  if (selection.make && !selection.model && options.models.length === 0) return "No verified U.S. models found for this manufacturer and year.";
  if (selection.model && options.sizeLookupFailed) {
    return "Tire-size data could not be loaded. Please try again or call us for assistance.";
  }
  if (selection.model && options.sizes.length === 0) {
    return "No verified tire sizes were found for this vehicle. Please call Tire Pro and Repair for assistance.";
  }
  return "";
}
