import { getRuntimeEnv } from "@/lib/runtime-env";

export type WheelSizeErrorCode =
  | "missing_config"
  | "bad_key"
  | "rate_limited"
  | "no_results"
  | "network_error"
  | "unknown";

export type WheelSizeResult =
  | {
      ok: true;
      source: "wheel-size";
      cached: boolean;
      sizes: string[];
      raw: unknown;
    }
  | {
      ok: false;
      source: "wheel-size";
      cached: boolean;
      code: WheelSizeErrorCode;
      message: string;
      status?: number;
    };

const DEFAULT_BASE_URL = "https://api.wheel-size.com/v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const cache = new Map<string, { expiresAt: number; result: WheelSizeResult }>();

const tireSizePattern =
  /\b(?:P|LT)?\d{3}\/\d{2}(?:Z?R)\d{2}(?:C|LT|XL)?\b|\b\d{2}x\d{1,2}(?:\.\d{1,2})?R\d{2}(?:LT)?\b/gi;

export function normalizeTireSize(size: string) {
  return size.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function displayTireSize(size: string) {
  return size
    .trim()
    .replace(/\s+/g, "")
    .replace(/zr/i, "ZR")
    .replace(/r/i, "R")
    .replace(/lt$/i, "LT")
    .replace(/xl$/i, "XL")
    .replace(/c$/i, "C");
}

function cacheKey(year: number, make: string, model: string, region: string) {
  return `${year}:${make.trim().toLowerCase()}:${model.trim().toLowerCase()}:${region}`;
}

function extractTireSizes(value: unknown, found = new Set<string>()) {
  if (typeof value === "string") {
    const matches = value.match(tireSizePattern) || [];
    for (const match of matches) found.add(displayTireSize(match));
    return found;
  }

  if (Array.isArray(value)) {
    for (const item of value) extractTireSizes(item, found);
    return found;
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) extractTireSizes(nested, found);
  }

  return found;
}

function wheelSizeError(status: number, body: unknown): WheelSizeErrorCode {
  const text = JSON.stringify(body).toLowerCase();
  if (status === 401 || status === 403 || text.includes("key") || text.includes("auth")) return "bad_key";
  if (status === 429 || text.includes("rate") || text.includes("limit")) return "rate_limited";
  if (status === 404) return "no_results";
  return "unknown";
}

function errorMessage(code: WheelSizeErrorCode) {
  switch (code) {
    case "missing_config":
      return "Wheel-Size API credentials are not configured.";
    case "bad_key":
      return "Wheel-Size API key was rejected.";
    case "rate_limited":
      return "Wheel-Size API rate limit reached.";
    case "no_results":
      return "No Wheel-Size fitment data was found for this vehicle.";
    case "network_error":
      return "Wheel-Size API request failed.";
    default:
      return "Wheel-Size API returned an unexpected response.";
  }
}

export async function searchWheelSizeByModel({
  year,
  make,
  model,
  region = "usdm",
}: {
  year: number;
  make: string;
  model: string;
  region?: string;
}): Promise<WheelSizeResult> {
  const key = cacheKey(year, make, model, region);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cached: true } as WheelSizeResult;
  }

  const apiKey = getRuntimeEnv("WHEEL_SIZE_API_KEY");
  const baseUrl = getRuntimeEnv("WHEEL_SIZE_API_BASE_URL") || DEFAULT_BASE_URL;
  if (!apiKey || !baseUrl) {
    return {
      ok: false,
      source: "wheel-size",
      cached: false,
      code: "missing_config",
      message: errorMessage("missing_config"),
    };
  }

  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/search/by_model/`);
  url.searchParams.set("user_key", apiKey);
  url.searchParams.set("make", make);
  url.searchParams.set("model", model);
  url.searchParams.set("year", String(year));
  url.searchParams.set("region", region);

  // Wheel-Size Sandbox key: testing only, not licensed for production traffic.
  // Upgrade to a paid plan before launch.
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const code = wheelSizeError(response.status, body);
      return {
        ok: false,
        source: "wheel-size",
        cached: false,
        code,
        message: errorMessage(code),
        status: response.status,
      };
    }

    const sizes = [...extractTireSizes(body)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const result: WheelSizeResult = sizes.length
      ? { ok: true, source: "wheel-size", cached: false, sizes, raw: body }
      : {
          ok: false,
          source: "wheel-size",
          cached: false,
          code: "no_results",
          message: errorMessage("no_results"),
          status: response.status,
        };

    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  } catch {
    return {
      ok: false,
      source: "wheel-size",
      cached: false,
      code: "network_error",
      message: errorMessage("network_error"),
    };
  }
}
