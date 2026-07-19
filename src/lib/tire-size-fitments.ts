type FinderSizeOption = {
  value: string;
  label: string;
  type: "square" | "staggered";
  front: string;
  rear: string;
};

const WHEEL_SIZE_BASE_URL = "https://www.wheel-size.com";
const TIRE_SIZE_BASE_URL = "https://tiresize.com";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const fitmentCache = new Map<string, { expiresAt: number; sizes: FinderSizeOption[] }>();

const tireSizePattern =
  /\b(?:P|LT)?\d{3}\/\d{2}(?:Z?R)\d{2}(?:C|LT|XL)?\b|\b\d{2}x\d{1,2}(?:\.\d{1,2})?R\d{2}(?:LT)?\b/gi;

const makeSlugOverrides: Record<string, string> = {
  "mercedes benz": "mercedes-benz",
  "mercedes-benz": "mercedes-benz",
  "rolls royce": "rolls-royce",
  "rolls-royce": "rolls-royce",
};

const tireSizeModelAliases: Record<string, Record<string, string>> = {
  ford: {
    "f-150": "F150",
  },
  "mercedes-benz": {
    "c-class": "C300",
    "e-class": "E300",
    "glc-class": "GLC300",
    "gle-class": "GLE350",
  },
};

function normalizeLookupKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugifyVehiclePart(value: string) {
  return normalizeLookupKey(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeSlug(make: string) {
  const key = normalizeLookupKey(make);
  return makeSlugOverrides[key] || slugifyVehiclePart(make);
}

function modelSlug(model: string) {
  return slugifyVehiclePart(model);
}

function wheelSizeUrl(year: number, make: string, model: string) {
  return `${WHEEL_SIZE_BASE_URL}/size/${makeSlug(make)}/${modelSlug(model)}/${year}/`;
}

function tireSizePathSegment(value: string) {
  return value
    .trim()
    .replace(/[’']/g, "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .map((part) => (/^[A-Z0-9]+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join("-");
}

function tireSizeDotComUrl(make: string, model: string) {
  const makeSegment = makeSlug(make) === "mercedes-benz" ? "Mercedes-Benz" : tireSizePathSegment(make);
  const modelKey = modelSlug(model);
  const modelSegment = tireSizeModelAliases[makeSlug(make)]?.[modelKey] || tireSizePathSegment(model);
  return `${TIRE_SIZE_BASE_URL}/tires/${makeSegment}/${modelSegment}/`;
}

function normalizeTireLabel(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/zr/i, "ZR")
    .replace(/r/i, "R")
    .replace(/lt$/i, "LT")
    .replace(/xl$/i, "XL")
    .replace(/c$/i, "C");
}

function tireSizeValue(size: string) {
  return normalizeTireLabel(size)
    .replace(/\//g, "-")
    .replace(/(Z?R)(\d{2})/i, "$1-$2")
    .toUpperCase();
}

function parseOeTireSizes(html: string) {
  const rows = html.match(/<tr\b[^>]*class=["'][^"']*\bstock\b[^"']*["'][\s\S]*?<\/tr>/gi) || [];
  const sizes = new Set<string>();

  for (const row of rows) {
    if (!/(Original Equipment|>\s*OE\s*<)/i.test(row)) continue;
    const matches = row.match(tireSizePattern) || [];
    for (const match of matches) {
      sizes.add(normalizeTireLabel(match));
    }
  }

  return [...sizes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function fetchVehicleFitmentPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (response.status === 404) return "";
    if (!response.ok) throw new Error(`Wheel-Size request failed with ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTireSizeModelPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (response.status === 404) return "";
    if (!response.ok) throw new Error(`TireSize request failed with ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseTireSizeDotComYear(html: string, year: number) {
  const startMatch = html.match(new RegExp(`<div id=["']${year}["'] class=["']cardivs["']>`, "i"));
  if (!startMatch || startMatch.index === undefined) return [];

  const start = startMatch.index + startMatch[0].length;
  const nextYearSection = html.slice(start).search(/<div id=["']\d{4}["'] class=["']cardivs["']>/i);
  const contentClose = html.indexOf("</div><!-- close content-->", start);
  const adBreak = html.indexOf("<br><br>", start);
  const endCandidates = [
    nextYearSection === -1 ? -1 : start + nextYearSection,
    contentClose,
    adBreak,
  ].filter((value) => value > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : html.length;
  const section = html.slice(start, end);

  const sizes = new Set<string>();
  const matches = section.match(tireSizePattern) || [];
  for (const match of matches) {
    sizes.add(normalizeTireLabel(match));
  }

  return [...sizes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function getWheelSizeFitments(year: number, make: string, model: string) {
  const html = await fetchVehicleFitmentPage(wheelSizeUrl(year, make, model));
  return parseOeTireSizes(html);
}

async function getTireSizeDotComFitments(year: number, make: string, model: string) {
  const html = await fetchTireSizeModelPage(tireSizeDotComUrl(make, model));
  return parseTireSizeDotComYear(html, year);
}

export async function getVerifiedTireSizesForVehicle({
  year,
  make,
  model,
}: {
  year: number;
  make: string;
  model: string;
}) {
  const key = `${year}:${normalizeLookupKey(make)}:${normalizeLookupKey(model)}`;
  const cached = fitmentCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.sizes;

  let labels: string[] = [];
  let wheelSizeFailed = false;
  let tireSizeFailed = false;

  try {
    labels = await getWheelSizeFitments(year, make, model);
  } catch {
    wheelSizeFailed = true;
  }

  if (labels.length === 0) {
    try {
      labels = await getTireSizeDotComFitments(year, make, model);
    } catch {
      tireSizeFailed = true;
    }
  }

  if (wheelSizeFailed && tireSizeFailed) {
    throw new Error("Verified tire-size sources could not be loaded.");
  }

  const sizes = labels.map((size) => ({
    value: tireSizeValue(size),
    label: size,
    type: "square" as const,
    front: size,
    rear: "",
  }));

  fitmentCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    sizes,
  });

  return sizes;
}

export const verifiedTireSizeSource = "Wheel-Size.com OE fitment pages with TireSize.com year/model fallback";
