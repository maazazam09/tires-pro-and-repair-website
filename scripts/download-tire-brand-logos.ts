import { config } from "dotenv";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

type BrandKey =
  | "bfgoodrich"
  | "bridgestone"
  | "continental"
  | "cooper"
  | "falken"
  | "federal"
  | "firestone"
  | "goodyear"
  | "gt-radial"
  | "general-tire"
  | "hankook"
  | "kumho"
  | "michelin"
  | "nexen"
  | "nitto"
  | "pirelli"
  | "sailun"
  | "toyo"
  | "yokohama"
  | "maxxis";

type BrandResolution =
  | { status: "resolved"; brand: BrandKey; reason: string }
  | { status: "ambiguous"; candidates: string[]; reason: string }
  | { status: "unclear"; reason: string };

const BRAND_LOGOS: Record<
  BrandKey,
  { sourceLabel: string; url: string }
> = {
  bfgoodrich: {
    sourceLabel: "BFGoodrich official (bfgoodrichtires.com)",
    url: "https://www.bfgoodrichtires.com/public/themes/bfgoodrich/assets/images/logos/svg/logo-brand.svg",
  },
  michelin: {
    sourceLabel: "Michelin official (michelinman.com)",
    url: "https://www.michelinman.com/public/themes/michelin-commercial/assets/images/logos/svg/logo-brand.svg",
  },
  continental: {
    sourceLabel: "Continental official (continentaltire.com)",
    url: "https://www.continentaltire.com/themes/custom/nextcontinental/assets/images/logo-dark.svg",
  },
  goodyear: {
    sourceLabel: "Goodyear official (goodyear.com)",
    url: "https://www.goodyear.com/_next/static/media/primary-dark-brand-logo.2bpgmlh3ffhwu.svg",
  },
  pirelli: {
    sourceLabel: "Pirelli official (pirelli.com)",
    url: "https://www.pirelli.com/global/en-ww/assets/images/pirelli-logo.png",
  },
  yokohama: {
    sourceLabel: "Yokohama official (yokohama CDN)",
    url: "https://ytc-bm.s3.us-east-2.amazonaws.com/_1200x630_crop_center-center_82_none/Yokohama_logo.jpg",
  },
  toyo: {
    sourceLabel: "Toyo official (toyotires.com)",
    url: "https://www.toyotires.com/images/toyo_ig_logo.jpg",
  },
  kumho: {
    sourceLabel: "Kumho official (kumhotireusa.com)",
    url: "https://www.kumhotireusa.com/kumho-logo.png",
  },
  nexen: {
    sourceLabel: "Nexen official (nexentire.com)",
    url: "https://www.nexentire.com/international/assets/images/common/logo.png",
  },
  nitto: {
    sourceLabel: "Nitto official (nittotire.com)",
    url: "https://www.nittotire.com/media/ij3l5cph/header-nitto-logo.svg",
  },
  cooper: {
    sourceLabel: "Cooper official (coopertire.com)",
    url: "https://www.coopertire.com/on/demandware.static/Sites-CooperTire-Site/-/default/dwc8ba6c80/images/logo.svg",
  },
  maxxis: {
    sourceLabel: "Maxxis official (maxxis.com)",
    url: "https://www.maxxis.com/int/wp-content/themes/maxxis/assets/images/logo.svg",
  },
  firestone: {
    sourceLabel: "Firestone official (firestonetire.com)",
    url: "https://www.firestonetire.com/content/dam/consumer/fst/na/logos/firestone-shield.svg",
  },
  "general-tire": {
    sourceLabel: "General Tire official (generaltire.com)",
    url: "https://www.generaltire.com/themes/custom/gt/logo.svg",
  },
  hankook: {
    sourceLabel: "Hankook official (hankooktire.com)",
    url: "https://asset.hankooktire.com/content/dam/hankooktire/global/svg/logo.svg",
  },
  federal: {
    sourceLabel: "Federal official (federaltire.com)",
    url: "https://www.federaltire.com/en/images/share_logo.jpg",
  },
  "gt-radial": {
    sourceLabel: "GT Radial official (gtradial.com)",
    url: "https://www.gtradial.com/storage/images/general/logo.svg",
  },
  bridgestone: {
    sourceLabel: "Bridgestone official (bridgestone.com favicon mark)",
    url: "https://www.bridgestone.com/etc/images/favicons/bridgestone-152.png",
  },
};

const BRAND_ALIASES: Array<{ key: BrandKey; patterns: RegExp[] }> = [
  { key: "bfgoodrich", patterns: [/^bfgoodrich$/i, /bf\s*goodrich/i] },
  { key: "bridgestone", patterns: [/^bridgestone$/i] },
  { key: "continental", patterns: [/^continental$/i] },
  { key: "cooper", patterns: [/^cooper$/i] },
  { key: "federal", patterns: [/^federal$/i] },
  { key: "firestone", patterns: [/^firestone$/i] },
  { key: "goodyear", patterns: [/^goodyear$/i] },
  { key: "gt-radial", patterns: [/gt\s*radial/i] },
  { key: "general-tire", patterns: [/general\s*tires?/i] },
  { key: "hankook", patterns: [/^hnakook$/i, /^hankook$/i] },
  { key: "kumho", patterns: [/^kumho$/i] },
  { key: "michelin", patterns: [/^michelin/i] },
  { key: "nexen", patterns: [/^nexen$/i] },
  { key: "nitto", patterns: [/^nitto$/i] },
  { key: "pirelli", patterns: [/^pirelli$/i] },
  { key: "toyo", patterns: [/^toyo$/i] },
  { key: "yokohama", patterns: [/^yokohama$/i] },
  { key: "maxxis", patterns: [/^maxxis$/i] },
  { key: "falken", patterns: [/^falken$/i] },
  { key: "sailun", patterns: [/^sailun$/i] },
];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function detectBrand(name: string, brandField: string): BrandResolution {
  const haystack = normalize(`${name} ${brandField}`);
  const matches = BRAND_ALIASES.filter((entry) =>
    entry.patterns.some((pattern) => pattern.test(haystack) || pattern.test(normalize(name)) || pattern.test(normalize(brandField))),
  );

  if (matches.length > 1) {
    return {
      status: "ambiguous",
      candidates: matches.map((m) => m.key),
      reason: `Multiple brand matches for "${name}"`,
    };
  }

  if (matches.length === 1) {
    return {
      status: "resolved",
      brand: matches[0].key,
      reason: `Matched brand ${matches[0].key}`,
    };
  }

  if (/used\s+tire/i.test(name) || /^mixed$/i.test(normalize(brandField))) {
    return { status: "unclear", reason: "No single tire brand in product name" };
  }

  return { status: "unclear", reason: `Unable to identify a single brand from "${name}"` };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadLogo(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TireProLogoBot/1.0)",
      Accept: "image/*,*/*",
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
    .resize(800, 800, { fit: "inside", withoutEnlargement: true, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(outputPath);
}

async function verifyLogoFile(filePath: string): Promise<void> {
  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 40 || metadata.height < 40) {
    throw new Error(`Invalid logo dimensions for ${filePath}`);
  }
}

async function main() {
  const logosDir = path.join(process.cwd(), "public", "uploads", "tires", "logos");
  await mkdir(logosDir, { recursive: true });

  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const downloaded = new Map<BrandKey, string>();
  const updated: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];
  const failed: Array<Record<string, unknown>> = [];

  for (const product of products) {
    const resolution = detectBrand(product.name, product.brand);

    if (resolution.status !== "resolved") {
      skipped.push({
        name: product.name,
        slug: product.slug,
        status: resolution.status,
        reason: resolution.reason,
        candidates: resolution.status === "ambiguous" ? resolution.candidates : undefined,
      });
      continue;
    }

    const brand = resolution.brand;
    const assignment = BRAND_LOGOS[brand as keyof typeof BRAND_LOGOS];
    if (!assignment) {
      skipped.push({
        name: product.name,
        slug: product.slug,
        detectedBrand: brand,
        status: "skipped",
        reason: `${brand} official logo not downloadable automatically`,
      });
      continue;
    }
    const filename = `${brand}.webp`;
    const localFilePath = path.join(logosDir, filename);
    const publicUrl = `/uploads/tires/logos/${filename}`;

    try {
      if (!downloaded.has(brand)) {
        const buffer = await downloadLogo(assignment.url);
        await saveLogoWebp(buffer, localFilePath);
        await verifyLogoFile(localFilePath);
        downloaded.set(brand, publicUrl);
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
        detectedBrand: brand,
        sourceLabel: assignment.sourceLabel,
        logoFile: publicUrl,
        localFile: localFilePath,
      });
    } catch (error) {
      failed.push({
        name: product.name,
        slug: product.slug,
        detectedBrand: brand,
        sourceLabel: assignment.sourceLabel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const afterCount = await prisma.product.count({ where: { category: "TIRE" } });
  if (afterCount !== products.length) {
    throw new Error(`Tire product count changed: ${products.length} -> ${afterCount}`);
  }

  const result = {
    success: failed.length === 0,
    total: products.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    downloadedBrands: [...downloaded.keys()],
    updated,
    skipped,
    failed,
  };

  const reportPath = path.join(process.cwd(), "scripts", "tire-brand-logo-assignments.json");
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