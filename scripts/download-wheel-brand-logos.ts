import { config } from "dotenv";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

type WheelBrandKey =
  | "american-racing"
  | "asanti"
  | "bbs"
  | "black-rhino"
  | "enkei"
  | "fifteen52"
  | "forgiato"
  | "fuel-off-road"
  | "hre"
  | "kmc"
  | "konig"
  | "lexani"
  | "method-race-wheels"
  | "moto-metal"
  | "rotiform"
  | "tsw"
  | "vision-wheel"
  | "vossen"
  | "xd-series";

type BrandResolution =
  | { status: "resolved"; brand: WheelBrandKey; reason: string }
  | { status: "unclear"; reason: string };

const WHEEL_BRAND_LOGOS: Record<WheelBrandKey, { sourceLabel: string; sourcePage: string; url: string }> = {
  "american-racing": {
    sourceLabel: "American Racing logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/378330/american-racing",
    url: "https://images.seeklogo.com/logo-png/37/1/american-racing-logo-png_seeklogo-378330.png",
  },
  asanti: {
    sourceLabel: "Asanti Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/345024/asanti-wheels",
    url: "https://images.seeklogo.com/logo-png/34/1/asanti-wheels-logo-png_seeklogo-345024.png",
  },
  bbs: {
    sourceLabel: "BBS USA official logo",
    sourcePage: "https://www.bbs-usa.com/",
    url: "https://www.bbs-usa.com/images/logo_bbsusa.png",
  },
  "black-rhino": {
    sourceLabel: "Black Rhino Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/300441/black-rhino-wheels",
    url: "https://images.seeklogo.com/logo-png/30/1/black-rhino-wheels-logo-png_seeklogo-300441.png",
  },
  enkei: {
    sourceLabel: "Enkei official logo",
    sourcePage: "https://enkei.com/enkei-logo/",
    url: "https://enkei.com/wp-content/uploads/2011/01/enkei-logo.jpg",
  },
  fifteen52: {
    sourceLabel: "Fifteen52 official logo",
    sourcePage: "https://fifteen52.com/",
    url: "https://fifteen52.com/cdn/shop/files/Fifteen52_wheels_logo_-_footer_-_Pantone_151C.png",
  },
  forgiato: {
    sourceLabel: "Forgiato logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/536845/forgiato",
    url: "https://images.seeklogo.com/logo-png/53/1/forgiato-logo-png_seeklogo-536845.png",
  },
  "fuel-off-road": {
    sourceLabel: "Fuel Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/275055/fuel-wheels",
    url: "https://images.seeklogo.com/logo-png/27/1/fuel-wheels-logo-png_seeklogo-275055.png",
  },
  hre: {
    sourceLabel: "HRE Performance Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/405321/hre-performance-wheels",
    url: "https://images.seeklogo.com/logo-png/40/1/hre-performance-wheels-logo-png_seeklogo-405321.png",
  },
  kmc: {
    sourceLabel: "KMC Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/547368/kmc-wheels",
    url: "https://images.seeklogo.com/logo-png/54/1/kmc-wheels-logo-png_seeklogo-547368.png",
  },
  konig: {
    sourceLabel: "Konig official logo",
    sourcePage: "https://konigwheels.com/",
    url: "https://konigwheels.com/cdn/shop/files/konig_logo.png",
  },
  lexani: {
    sourceLabel: "Lexani official logo",
    sourcePage: "https://lexani.com/",
    url: "https://lexani.com/wp-content/uploads/2025/07/New-LEXAN-Logo-Color.png",
  },
  "method-race-wheels": {
    sourceLabel: "Method Race Wheels official logo",
    sourcePage: "https://www.methodracewheels.com/",
    url: "https://www.methodracewheels.com/cdn/shop/files/MRW_Method-Race-Wheels-solo-_R_-black-logo_0b1f88e8-ff7b-4100-b643-41740d9d0c29_194x.png",
  },
  "moto-metal": {
    sourceLabel: "Moto Metal Wheels logo (seeklogo; parent site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/345022/moto-metal-wheels",
    url: "https://images.seeklogo.com/logo-png/34/1/moto-metal-wheels-logo-png_seeklogo-345022.png",
  },
  rotiform: {
    sourceLabel: "Rotiform Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/331895/rotiform-wheels",
    url: "https://images.seeklogo.com/logo-png/33/1/rotiform-wheels-logo-png_seeklogo-331895.png",
  },
  tsw: {
    sourceLabel: "TSW Alloy Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/142831/tsw",
    url: "https://images.seeklogo.com/logo-png/14/1/tsw-logo-png_seeklogo-142831.png",
  },
  "vision-wheel": {
    sourceLabel: "Vision Wheel official logo",
    sourcePage: "https://visionwheel.com/",
    url: "https://visionwheel.com/wp-content/uploads/2024/05/headerlogotransparent.png",
  },
  vossen: {
    sourceLabel: "Vossen Wheels logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/557032/vossen-wheels",
    url: "https://images.seeklogo.com/logo-png/55/1/vossen-wheels-logo-png_seeklogo-557032.png",
  },
  "xd-series": {
    sourceLabel: "KMC Wheels XD Series logo (seeklogo; brand site confirmed)",
    sourcePage: "https://seeklogo.com/vector-logo/427582/kmc-wheels-xd-series",
    url: "https://images.seeklogo.com/logo-png/42/1/kmc-wheels-xd-series-logo-png_seeklogo-427582.png",
  },
};

const BRAND_ALIASES: Array<{ key: WheelBrandKey; patterns: RegExp[] }> = [
  { key: "american-racing", patterns: [/american\s+racing/i] },
  { key: "asanti", patterns: [/asanti/i] },
  { key: "bbs", patterns: [/\bbbs\b/i] },
  { key: "black-rhino", patterns: [/black\s+rhino/i] },
  { key: "enkei", patterns: [/enk(?:e|i)ei/i, /^enkie$/i, /^enkei$/i] },
  { key: "fifteen52", patterns: [/fifteen\s*52/i] },
  { key: "forgiato", patterns: [/forgiato/i] },
  { key: "fuel-off-road", patterns: [/fuel(?:\s+off[-\s]?road)?/i] },
  { key: "hre", patterns: [/\bhre\b/i] },
  { key: "kmc", patterns: [/\bkmc\b/i] },
  { key: "konig", patterns: [/konig/i] },
  { key: "lexani", patterns: [/lexani/i] },
  { key: "method-race-wheels", patterns: [/method\s+race\s+wheels/i] },
  { key: "moto-metal", patterns: [/moto\s+metal/i] },
  { key: "rotiform", patterns: [/rotiform/i] },
  { key: "tsw", patterns: [/\btsw\b/i] },
  { key: "vision-wheel", patterns: [/vision\s+wheel/i] },
  { key: "vossen", patterns: [/vossen/i] },
  { key: "xd-series", patterns: [/\bxd\s+series\b/i] },
];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function detectWheelBrand(name: string, brandField: string): BrandResolution {
  const nameValue = normalize(name);
  const brandValue = normalize(brandField);
  const haystack = `${nameValue} ${brandValue}`;

  const matches = BRAND_ALIASES.filter((entry) =>
    entry.patterns.some((pattern) => pattern.test(nameValue) || pattern.test(brandValue) || pattern.test(haystack)),
  );

  if (matches.length === 1) {
    return { status: "resolved", brand: matches[0].key, reason: `Matched ${matches[0].key}` };
  }

  return { status: "unclear", reason: `Unable to identify a single wheel brand from "${name}"` };
}

function refererForLogoUrl(url: string, sourcePage: string): string {
  try {
    return new URL(sourcePage || url).origin + "/";
  } catch {
    return sourcePage;
  }
}

async function downloadLogo(url: string, sourcePage: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: refererForLogoUrl(url, sourcePage),
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 200) {
    throw new Error(`Downloaded logo too small (${buffer.length} bytes) from ${url}`);
  }

  return buffer;
}

async function saveLogoWebp(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer, { density: 300 })
    .resize(720, 280, {
      fit: "inside",
      withoutEnlargement: false,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .extend({
      top: 60,
      bottom: 60,
      left: 60,
      right: 60,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(outputPath);
}

async function verifyLogoFile(filePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 80 || metadata.height < 80) {
    throw new Error(`Invalid logo dimensions for ${filePath}`);
  }

  return { width: metadata.width, height: metadata.height };
}

async function main() {
  const logosDir = path.join(process.cwd(), "public", "uploads", "wheels", "logos");
  await mkdir(logosDir, { recursive: true });

  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "WHEEL" },
    orderBy: { name: "asc" },
  });

  const downloaded = new Map<WheelBrandKey, { publicUrl: string; width: number; height: number }>();
  const updated: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];
  const failed: Array<Record<string, unknown>> = [];

  for (const product of products) {
    const resolution = detectWheelBrand(product.name, product.brand);

    if (resolution.status !== "resolved") {
      skipped.push({
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        reason: resolution.reason,
      });
      continue;
    }

    const logo = WHEEL_BRAND_LOGOS[resolution.brand];
    const filename = `${resolution.brand}.webp`;
    const localFilePath = path.join(logosDir, filename);
    const publicUrl = `/uploads/wheels/logos/${filename}`;

    try {
      if (!downloaded.has(resolution.brand)) {
        const buffer = await downloadLogo(logo.url, logo.sourcePage);
        await saveLogoWebp(buffer, localFilePath);
        const dimensions = await verifyLogoFile(localFilePath);
        downloaded.set(resolution.brand, { publicUrl, ...dimensions });
      }

      const before = { ...product };
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: publicUrl },
      });

      if (
        updatedProduct.name !== before.name ||
        updatedProduct.slug !== before.slug ||
        updatedProduct.brand !== before.brand ||
        updatedProduct.description !== before.description ||
        updatedProduct.category !== before.category ||
        updatedProduct.active !== before.active ||
        updatedProduct.price !== before.price ||
        updatedProduct.size !== before.size ||
        updatedProduct.type !== before.type
      ) {
        throw new Error(`Non-image fields changed for ${product.slug}`);
      }

      updated.push({
        name: product.name,
        slug: product.slug,
        detectedBrand: resolution.brand,
        sourceLabel: logo.sourceLabel,
        sourcePage: logo.sourcePage,
        logoFile: publicUrl,
        localFile: localFilePath,
      });
    } catch (error) {
      failed.push({
        name: product.name,
        slug: product.slug,
        detectedBrand: resolution.brand,
        sourceLabel: logo.sourceLabel,
        sourcePage: logo.sourcePage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const afterCount = await prisma.product.count({ where: { category: "WHEEL" } });
  if (afterCount !== products.length) {
    throw new Error(`Wheel product count changed: ${products.length} -> ${afterCount}`);
  }

  const result = {
    success: failed.length === 0,
    total: products.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    downloadedBrands: [...downloaded.entries()].map(([brand, file]) => ({ brand, ...file })),
    updated,
    skipped,
    failed,
  };

  const reportPath = path.join(process.cwd(), "scripts", "wheel-brand-logo-assignments.json");
  await writeFile(reportPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  if (failed.length > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
