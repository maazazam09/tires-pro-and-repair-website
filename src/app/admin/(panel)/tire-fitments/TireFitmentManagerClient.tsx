"use client";

import { useMemo, useState, type FormEvent } from "react";

type TirePosition = "GENERAL" | "FRONT" | "REAR";

type FitmentSize = {
  id: string;
  position: TirePosition;
  displaySize: string;
  normalizedSize: string;
  width: number;
  aspectRatio: number;
  construction: string;
  rimDiameter: number;
};

type Fitment = {
  id: string;
  active: boolean;
  year: number;
  make: string;
  model: string;
  option: string;
  tireSizes: FitmentSize[];
};

type ApiFitment = {
  id: string;
  active: boolean;
  year: { year: number };
  make: { name: string };
  model: { name: string };
  option: { name: string };
  tireSizes: Array<{
    id: string;
    position: TirePosition;
    tireSize: {
      displaySize: string;
      normalizedSize: string;
      width: number;
      aspectRatio: number;
      construction: string;
      rimDiameter: number;
    };
  }>;
};

type TireProduct = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  imageUrl?: string | null;
  currentSizes: string[];
};

type FormState = {
  id: string;
  year: string;
  make: string;
  model: string;
  option: string;
  fitmentType: "square" | "staggered";
  standardSize: string;
  frontSize: string;
  rearSize: string;
  active: boolean;
};

type CsvRow = {
  index: number;
  year: string;
  make: string;
  model: string;
  option: string;
  frontSize: string;
  rearSize: string;
  active: boolean;
  errors: string[];
  duplicate: boolean;
};

const emptyForm: FormState = {
  id: "",
  year: "",
  make: "",
  model: "",
  option: "",
  fitmentType: "square",
  standardSize: "",
  frontSize: "",
  rearSize: "",
  active: true,
};

const fieldClass = "w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground";
const labelClass = "mb-1 block text-sm text-metallic";
const tireSizePattern = /^\d{3}\/\d{2}Z?R\d{2}$/i;

function getSize(fitment: Fitment, position: TirePosition) {
  return fitment.tireSizes.find((size) => size.position === position)?.displaySize || "";
}

function getFitmentType(fitment: Fitment) {
  return fitment.tireSizes.some((size) => size.position === "FRONT" || size.position === "REAR")
    ? "Staggered"
    : "Square";
}

function duplicateKey(row: Pick<Fitment, "year" | "make" | "model" | "option">) {
  return `${row.year}|${row.make}|${row.model}|${row.option}`.toLowerCase();
}

function csvCells(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function validateCsvRow(row: CsvRow) {
  const errors: string[] = [];
  const year = Number(row.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) errors.push("Invalid year");
  if (!row.make) errors.push("Missing make");
  if (!row.model) errors.push("Missing model");
  if (!row.option) errors.push("Missing option/trim");
  if (!row.frontSize || !tireSizePattern.test(row.frontSize)) errors.push("Invalid front size");
  if (row.rearSize && !tireSizePattern.test(row.rearSize)) errors.push("Invalid rear size");
  return errors;
}

export function TireFitmentManagerClient({
  initialFitments,
  tireProducts,
}: {
  initialFitments: Fitment[];
  tireProducts: TireProduct[];
}) {
  const [fitments, setFitments] = useState(initialFitments);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filters, setFilters] = useState({ search: "", year: "", make: "", model: "", tireSize: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkSize, setBulkSize] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);

  const duplicateKeys = useMemo(() => new Set(fitments.map(duplicateKey)), [fitments]);
  const selectedProductDetails = tireProducts.filter((product) => selectedProducts.includes(product.id));

  async function refreshFitments(nextFilters = filters) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ list: "1" });
    for (const [key, value] of Object.entries(nextFilters)) {
      if (value.trim()) params.set(key, value.trim());
    }

    try {
      const response = await fetch(`/api/tires/fitments?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load fitments.");
      setFitments((body.fitments as ApiFitment[]).map((fitment) => ({
        id: fitment.id,
        active: fitment.active,
        year: fitment.year.year,
        make: fitment.make.name,
        model: fitment.model.name,
        option: fitment.option.name,
        tireSizes: fitment.tireSizes.map((link) => ({
          id: link.id,
          position: link.position,
          displaySize: link.tireSize.displaySize,
          normalizedSize: link.tireSize.normalizedSize,
          width: link.tireSize.width,
          aspectRatio: link.tireSize.aspectRatio,
          construction: link.tireSize.construction,
          rimDiameter: link.tireSize.rimDiameter,
        })),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fitments.");
    } finally {
      setLoading(false);
    }
  }

  async function saveFitment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    const tireSizes = form.fitmentType === "square"
      ? [{ position: "GENERAL", size: form.standardSize.trim() }]
      : [
          { position: "FRONT", size: form.frontSize.trim() },
          { position: "REAR", size: form.rearSize.trim() },
        ];

    try {
      const response = await fetch("/api/tires/fitments", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          year: form.year,
          make: form.make,
          model: form.model,
          option: form.option,
          active: form.active,
          tireSizes,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to save fitment.");
      setStatus(form.id ? "Fitment updated." : "Fitment created.");
      setForm(emptyForm);
      await refreshFitments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save fitment.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFitment(id: string) {
    if (!confirm("Delete this tire fitment? This cannot be undone.")) return;
    setStatus("");
    setError("");

    try {
      const response = await fetch(`/api/tires/fitments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to delete fitment.");
      setStatus("Fitment deleted.");
      setFitments((current) => current.filter((fitment) => fitment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete fitment.");
    }
  }

  function editFitment(fitment: Fitment) {
    const staggered = getFitmentType(fitment) === "Staggered";
    setForm({
      id: fitment.id,
      year: String(fitment.year),
      make: fitment.make,
      model: fitment.model,
      option: fitment.option,
      fitmentType: staggered ? "staggered" : "square",
      standardSize: getSize(fitment, "GENERAL"),
      frontSize: getSize(fitment, "FRONT"),
      rearSize: getSize(fitment, "REAR"),
      active: fitment.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previewCsv() {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
    const header = lines.shift()?.split(",").map((cell) => cell.trim().toLowerCase()) || [];
    const getIndex = (name: string) => header.indexOf(name);
    const seenRows = new Set<string>();
    const rows = lines.map((line, index) => {
      const cells = csvCells(line);
      const row: CsvRow = {
        index: index + 2,
        year: cells[getIndex("year")] || "",
        make: cells[getIndex("make")] || "",
        model: cells[getIndex("model")] || "",
        option: cells[getIndex("option")] || "",
        frontSize: cells[getIndex("frontsize")] || "",
        rearSize: cells[getIndex("rearsize")] || "",
        active: (cells[getIndex("active")] || "true").toLowerCase() !== "false",
        errors: [],
        duplicate: false,
      };
      row.errors = validateCsvRow(row);
      const key = duplicateKey({ ...row, year: Number(row.year) });
      row.duplicate = duplicateKeys.has(key) || seenRows.has(key);
      seenRows.add(key);
      return row;
    });

    setCsvRows(rows);
  }

  async function importCsvRows() {
    const validRows = csvRows.filter((row) => row.errors.length === 0 && !row.duplicate);
    if (validRows.length === 0) {
      setError("No valid CSV rows are ready to import.");
      return;
    }

    setImporting(true);
    setStatus("");
    setError("");
    let imported = 0;

    try {
      for (const row of validRows) {
        const response = await fetch("/api/tires/fitments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: row.year,
            make: row.make,
            model: row.model,
            option: row.option,
            active: row.active,
            tireSizes: row.rearSize
              ? [{ position: "FRONT", size: row.frontSize }, { position: "REAR", size: row.rearSize }]
              : [{ position: "GENERAL", size: row.frontSize }],
          }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(`Row ${row.index}: ${body.error || "Import failed."}`);
        imported += 1;
      }
      setStatus(`Imported ${imported} fitment${imported === 1 ? "" : "s"}.`);
      setCsvText("");
      setCsvRows([]);
      await refreshFitments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function saveBulkAssignment() {
    setBulkSaving(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/tires/product-sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts, size: bulkSize.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to assign tire size.");
      setStatus(`Assigned ${bulkSize.trim()} to ${selectedProducts.length} tire product${selectedProducts.length === 1 ? "" : "s"}.`);
      setSelectedProducts([]);
      setBulkSize("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign tire size.");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">Tire Fitment Manager</h1>
        <p className="mt-2 text-sm text-metallic">Manage vehicle fitments and tire-size links for tire products only.</p>
      </div>

      {status ? <p className="rounded border border-accent/40 bg-accent/10 p-3 text-sm font-semibold text-accent">{status}</p> : null}
      {error ? <p className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p> : null}

      <form onSubmit={saveFitment} className="card max-w-4xl space-y-4">
        <h2 className="font-semibold text-white">{form.id ? "Edit Vehicle Fitment" : "Add Vehicle Fitment"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Year</label>
            <input className={fieldClass} value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Make</label>
            <input className={fieldClass} value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Model</label>
            <input className={fieldClass} value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Option/Trim</label>
            <input className={fieldClass} value={form.option} onChange={(event) => setForm({ ...form, option: event.target.value })} required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Fitment Type</label>
            <select className={fieldClass} value={form.fitmentType} onChange={(event) => setForm({ ...form, fitmentType: event.target.value as FormState["fitmentType"] })}>
              <option value="square">Square</option>
              <option value="staggered">Staggered</option>
            </select>
          </div>
          {form.fitmentType === "square" ? (
            <div className="sm:col-span-2">
              <label className={labelClass}>Standard Tire Size</label>
              <input className={fieldClass} placeholder="235/35ZR20" value={form.standardSize} onChange={(event) => setForm({ ...form, standardSize: event.target.value })} required />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>Front Tire Size</label>
                <input className={fieldClass} placeholder="235/35ZR20" value={form.frontSize} onChange={(event) => setForm({ ...form, frontSize: event.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Rear Tire Size</label>
                <input className={fieldClass} placeholder="265/35ZR20" value={form.rearSize} onChange={(event) => setForm({ ...form, rearSize: event.target.value })} required />
              </div>
            </>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-metallic">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary text-xs">{saving ? "Saving..." : form.id ? "Update Fitment" : "Add Fitment"}</button>
          {form.id ? <button type="button" className="btn-secondary text-xs" onClick={() => setForm(emptyForm)}>Cancel Edit</button> : null}
        </div>
      </form>

      <section className="card space-y-4">
        <h2 className="font-semibold text-white">Search Fitments</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["search", "year", "make", "model", "tireSize"] as const).map((key) => (
            <div key={key}>
              <label className={labelClass}>{key === "tireSize" ? "Tire Size" : key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <input className={fieldClass} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} />
            </div>
          ))}
        </div>
        <button type="button" disabled={loading} className="btn-primary text-xs" onClick={() => refreshFitments()}>
          {loading ? "Searching..." : "Search"}
        </button>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-metallic">
              <tr>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Make</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Option/Trim</th>
                <th className="px-3 py-2">Front Size</th>
                <th className="px-3 py-2">Rear Size</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fitments.map((fitment) => (
                <tr key={fitment.id} className="border-t border-border/70 text-white">
                  <td className="px-3 py-2">{fitment.year}</td>
                  <td className="px-3 py-2">{fitment.make}</td>
                  <td className="px-3 py-2">{fitment.model}</td>
                  <td className="px-3 py-2">{fitment.option}</td>
                  <td className="px-3 py-2">{getSize(fitment, "FRONT") || getSize(fitment, "GENERAL")}</td>
                  <td className="px-3 py-2">{getSize(fitment, "REAR") || "-"}</td>
                  <td className="px-3 py-2">{getFitmentType(fitment)}</td>
                  <td className="px-3 py-2">{fitment.active ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary text-xs" onClick={() => editFitment(fitment)}>Edit</button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => deleteFitment(fitment.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {fitments.length === 0 ? (
                <tr><td className="px-3 py-4 text-metallic" colSpan={9}>No fitments found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-white">Bulk Size Assignment</h2>
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="max-h-72 overflow-auto rounded border border-border/70">
            {tireProducts.map((product) => (
              <label key={product.id} className="flex items-center gap-3 border-b border-border/70 px-3 py-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={(event) => {
                    setSelectedProducts((current) => event.target.checked
                      ? [...current, product.id]
                      : current.filter((id) => id !== product.id));
                  }}
                />
                <span className="flex-1">{product.brand} {product.name}</span>
                <span className="text-xs text-metallic">{product.currentSizes.join(", ") || "No size"}</span>
              </label>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Verified Tire Size</label>
              <input className={fieldClass} placeholder="235/35ZR20" value={bulkSize} onChange={(event) => setBulkSize(event.target.value)} />
            </div>
            <div className="rounded border border-border/70 p-3 text-sm text-metallic">
              Review: {selectedProductDetails.length} selected
              {selectedProductDetails.slice(0, 4).map((product) => (
                <div key={product.id} className="mt-1 text-white">{product.brand} {product.name}</div>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary w-full text-xs"
              disabled={bulkSaving || selectedProducts.length === 0 || !bulkSize.trim()}
              onClick={saveBulkAssignment}
            >
              {bulkSaving ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-white">CSV Import</h2>
        <textarea
          className={`${fieldClass} min-h-32`}
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder="year,make,model,option,frontSize,rearSize,active"
        />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary text-xs" onClick={previewCsv}>Preview CSV</button>
          <button type="button" className="btn-primary text-xs" disabled={importing || csvRows.length === 0} onClick={importCsvRows}>
            {importing ? "Importing..." : "Confirm Import"}
          </button>
        </div>
        {csvRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-metallic">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Front</th>
                  <th className="px-3 py-2">Rear</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row) => (
                  <tr key={row.index} className="border-t border-border/70 text-white">
                    <td className="px-3 py-2">{row.index}</td>
                    <td className="px-3 py-2">{row.year} {row.make} {row.model} {row.option}</td>
                    <td className="px-3 py-2">{row.frontSize}</td>
                    <td className="px-3 py-2">{row.rearSize || "-"}</td>
                    <td className="px-3 py-2">
                      {row.duplicate ? "Duplicate" : row.errors.length ? row.errors.join(", ") : "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
