"use client";

import { useMemo, useState } from "react";
import { AdminField } from "@/components/admin/AdminField";

type TireDetail = {
  model?: string | null;
  secondaryImage?: string | null;
  sku?: string | null;
  width?: number | null;
  aspectRatio?: number | null;
  construction?: string | null;
  rimDiameter?: number | null;
  tireSize?: string | null;
  loadIndex?: string | null;
  speedRating?: string | null;
  serviceDescription?: string | null;
  season?: string | null;
  warrantyMiles?: number | null;
  warrantyText?: string | null;
  videoUrl?: string | null;
  promotionAvailable?: boolean | null;
  promotionText?: string | null;
  requestQuoteEnabled?: boolean | null;
};

function value(input: string | number | null | undefined) {
  return input ?? "";
}

export function TireProductFields({ tireDetail }: { tireDetail?: TireDetail | null }) {
  const [width, setWidth] = useState(String(value(tireDetail?.width)));
  const [aspectRatio, setAspectRatio] = useState(String(value(tireDetail?.aspectRatio)));
  const [construction, setConstruction] = useState(String(value(tireDetail?.construction || "R")));
  const [rimDiameter, setRimDiameter] = useState(String(value(tireDetail?.rimDiameter)));
  const generatedSize = useMemo(() => {
    if (!width || !aspectRatio || !construction || !rimDiameter) return "";
    return `${width}/${aspectRatio}${construction.toUpperCase()}${rimDiameter}`;
  }, [aspectRatio, construction, rimDiameter, width]);
  const [tireSize, setTireSize] = useState(String(value(tireDetail?.tireSize || generatedSize)));
  const [manualSize, setManualSize] = useState(Boolean(tireDetail?.tireSize));

  function syncSize(next: {
    width?: string;
    aspectRatio?: string;
    construction?: string;
    rimDiameter?: string;
  }) {
    const nextWidth = next.width ?? width;
    const nextAspect = next.aspectRatio ?? aspectRatio;
    const nextConstruction = next.construction ?? construction;
    const nextRim = next.rimDiameter ?? rimDiameter;
    if (!manualSize && nextWidth && nextAspect && nextConstruction && nextRim) {
      setTireSize(`${nextWidth}/${nextAspect}${nextConstruction.toUpperCase()}${nextRim}`);
    }
  }

  return (
    <fieldset className="rounded border border-border/70 p-4">
      <input type="hidden" name="tireDetail" value="1" />
      <legend className="px-1 text-sm font-semibold text-white">Tire Product Fields</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminField label="Tire Model" name="tireModel" defaultValue={value(tireDetail?.model)} />
        <AdminField label="SKU" name="sku" defaultValue={value(tireDetail?.sku)} />
        <div>
          <label htmlFor="width" className="mb-1 block text-sm text-metallic">Width</label>
          <input
            id="width"
            name="width"
            type="number"
            value={width}
            onChange={(event) => {
              setWidth(event.target.value);
              syncSize({ width: event.target.value });
            }}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label htmlFor="aspectRatio" className="mb-1 block text-sm text-metallic">Aspect Ratio</label>
          <input
            id="aspectRatio"
            name="aspectRatio"
            type="number"
            value={aspectRatio}
            onChange={(event) => {
              setAspectRatio(event.target.value);
              syncSize({ aspectRatio: event.target.value });
            }}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label htmlFor="construction" className="mb-1 block text-sm text-metallic">Construction</label>
          <select
            id="construction"
            name="construction"
            value={construction}
            onChange={(event) => {
              setConstruction(event.target.value);
              syncSize({ construction: event.target.value });
            }}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground"
          >
            <option value="R">R</option>
            <option value="ZR">ZR</option>
          </select>
        </div>
        <div>
          <label htmlFor="rimDiameter" className="mb-1 block text-sm text-metallic">Rim Diameter</label>
          <input
            id="rimDiameter"
            name="rimDiameter"
            type="number"
            value={rimDiameter}
            onChange={(event) => {
              setRimDiameter(event.target.value);
              syncSize({ rimDiameter: event.target.value });
            }}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label htmlFor="tireSize" className="mb-1 block text-sm text-metallic">Display Tire Size</label>
          <input
            id="tireSize"
            name="tireSize"
            value={tireSize}
            onChange={(event) => {
              setManualSize(true);
              setTireSize(event.target.value);
            }}
            placeholder={generatedSize || "235/35ZR20"}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground"
          />
        </div>
        <AdminField label="Load Index" name="loadIndex" defaultValue={value(tireDetail?.loadIndex)} />
        <AdminField label="Speed Rating" name="speedRating" defaultValue={value(tireDetail?.speedRating)} />
        <AdminField label="Service Description" name="serviceDescription" defaultValue={value(tireDetail?.serviceDescription)} />
        <AdminField label="Season" name="season" defaultValue={value(tireDetail?.season)} />
        <AdminField label="Warranty in Miles" name="warrantyMiles" type="number" defaultValue={value(tireDetail?.warrantyMiles)} />
        <AdminField label="Warranty Text" name="warrantyText" defaultValue={value(tireDetail?.warrantyText)} />
        <AdminField label="Secondary Image URL" name="secondaryImage" defaultValue={value(tireDetail?.secondaryImage)} />
        <AdminField label="Product Video URL" name="videoUrl" defaultValue={value(tireDetail?.videoUrl)} />
        <AdminField label="Promotion Text" name="promotionText" defaultValue={value(tireDetail?.promotionText)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-metallic">
          <input type="checkbox" name="promotionAvailable" defaultChecked={Boolean(tireDetail?.promotionAvailable)} /> Promotion available
        </label>
        <label className="flex items-center gap-2 text-sm text-metallic">
          <input type="checkbox" name="requestQuoteEnabled" defaultChecked={tireDetail?.requestQuoteEnabled ?? true} /> Request quote enabled
        </label>
      </div>
    </fieldset>
  );
}
