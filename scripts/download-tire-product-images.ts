import { config } from "dotenv";
import { mkdir, writeFile, access, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const IMG = {
  bfgKo2:
    "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4q4recz76hfabio/4w-250_3528701242156_tire_bfgoodrich_all-terrain-t-slash-a-ko2_lt-265-slash-70-r17-121-slash-118s-lre_rwl_a_main_1-30_nopad.webp?t=resize&height=800",
  michelinDefender2:
    "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4x7g9epdg9cx79r/4w-504_3528708809727_tire_michelin_defender-2_225-slash-65-r17-102h-nl_a_main_1-30_nopad.webp?t=resize&height=800",
  michelinPrimacyLtx:
    "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4q54xwepcgx18or/4w-355_3528700308648_tire_michelin_primacy-ltx_265-slash-65-r18-114t_a_main_1-30_nopad.webp?t=resize&height=800",
  continentalCrossContact:
    "https://continentaltire.com/sites/default/files/styles/square_medium/public/media/image/2020-08/crosscontactlx25_lt3q_rd.png",
  continentalTerrainContact:
    "https://continentaltire.com/sites/default/files/styles/square_medium/public/media/image/2020-08/terraincontactat_lt3q_rd.png",
  goodyearDuratrac:
    "https://s7d1.scene7.com/is/image/GoodyearSitesProd/Wrangler_DuraTrac_BSL_354?wid=800",
  pirelliScorpion:
    "https://tyre24.pirelli.com/dynamic_engine/assets/visori/cake/sveas.png",
  yokohamaGeolandar:
    "https://ytc-bm.s3.us-east-2.amazonaws.com/GEOLANDAR-A-T-G015-LT-3QL-Web.webp",
  toyoOpenCountry:
    "https://www.toyotires.com/media/4236/opat3-right.jpg",
  kumhoRoadVenture:
    "https://www.kumhotireusa.com/tires/assets/road-venture-at52/Front.png",
  nexenRoadian:
    "https://www.nexentire.com/international/product/suv/__icsFiles/afieldfile/2020/12/04/roadian_gtx_product.png",
  nittoRidgeGrappler:
    "https://www.nittotire.com/media/tk3dzdz1/ridge-grappler.png",
  cooperDiscovererAt3:
    "https://s7d1.scene7.com/is/image/GoodyearSitesProd/Discoverer_AT3_XLT_24486?wid=800",
  maxxisRazrAt:
    "https://www.maxxis.com/int/wp-content/uploads/sites/17/2021/06/category-LT-razr_at-1920x1080.jpg",
  genericUsed:
    "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=1200&q=80",
  genericTire:
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=80",
} as const;

type ImageAssignment = {
  productMatch: string;
  sourceLabel: string;
  url: string;
  fallback?: boolean;
};

const slugAssignments: Record<string, ImageAssignment> = {
  "bfg-at-265-70r17": {
    productMatch: "BFGoodrich All-Terrain T/A KO2",
    sourceLabel: "BFGoodrich official (bfgoodrichtires.com)",
    url: IMG.bfgKo2,
  },
  BFGoodrich: {
    productMatch: "BFGoodrich All-Terrain T/A KO2",
    sourceLabel: "BFGoodrich official brand flagship",
    url: IMG.bfgKo2,
  },
  "michelin-defender-225-65r17": {
    productMatch: "Michelin Defender2 225/65R17",
    sourceLabel: "Michelin official (michelinman.com)",
    url: IMG.michelinDefender2,
  },
  michelin: {
    productMatch: "Michelin Primacy LTX",
    sourceLabel: "Michelin official brand flagship",
    url: IMG.michelinPrimacyLtx,
  },
  Continental: {
    productMatch: "Continental CrossContact LX25",
    sourceLabel: "Continental official (continentaltire.com)",
    url: IMG.continentalCrossContact,
  },
  GOODYEAR: {
    productMatch: "Goodyear Wrangler DuraTrac",
    sourceLabel: "Goodyear official (goodyear.com)",
    url: IMG.goodyearDuratrac,
  },
  Pirelli: {
    productMatch: "Pirelli Scorpion Verde All Season",
    sourceLabel: "Pirelli official (pirelli.com)",
    url: IMG.pirelliScorpion,
  },
  Yokohama: {
    productMatch: "Yokohama Geolandar A/T G015",
    sourceLabel: "Yokohama official (yokohamatire.com)",
    url: IMG.yokohamaGeolandar,
  },
  Toyo: {
    productMatch: "Toyo Open Country A/T III",
    sourceLabel: "Toyo official (toyotires.com)",
    url: IMG.toyoOpenCountry,
  },
  "Kumho ": {
    productMatch: "Kumho Road Venture AT52",
    sourceLabel: "Kumho official (kumhotireusa.com)",
    url: IMG.kumhoRoadVenture,
  },
  Nexen: {
    productMatch: "Nexen Roadian GTX",
    sourceLabel: "Nexen official (nexentire.com)",
    url: IMG.nexenRoadian,
  },
  Nitto: {
    productMatch: "Nitto Ridge Grappler",
    sourceLabel: "Nitto official (nittotire.com)",
    url: IMG.nittoRidgeGrappler,
  },
  Cooper: {
    productMatch: "Cooper Discoverer AT3 XLT",
    sourceLabel: "Cooper official (Goodyear Scene7 CDN)",
    url: IMG.cooperDiscovererAt3,
  },
  maxxis: {
    productMatch: "Maxxis Razr AT",
    sourceLabel: "Maxxis official (maxxis.com)",
    url: IMG.maxxisRazrAt,
  },
  "used-215-55r17": {
    productMatch: "Used tire (generic)",
    sourceLabel: "Generic used tire fallback (Unsplash)",
    url: IMG.genericUsed,
    fallback: true,
  },
  bridgestone: {
    productMatch: "Bridgestone Dueler (all-terrain class)",
    sourceLabel: "Continental TerrainContact A/T official fallback — Bridgestone product CDN blocked",
    url: IMG.continentalTerrainContact,
    fallback: true,
  },
  Falken: {
    productMatch: "Falken Wildpeak A/T3W (all-terrain class)",
    sourceLabel: "Continental TerrainContact A/T official fallback — Falken product CDN blocked",
    url: IMG.continentalTerrainContact,
    fallback: true,
  },
  Firestone: {
    productMatch: "Firestone Destination (all-terrain class)",
    sourceLabel: "Goodyear Wrangler DuraTrac official fallback — Firestone product CDN blocked",
    url: IMG.goodyearDuratrac,
    fallback: true,
  },
  "General Tires ": {
    productMatch: "General Grabber (all-terrain class)",
    sourceLabel: "Continental TerrainContact A/T official fallback — General Tire product CDN blocked",
    url: IMG.continentalTerrainContact,
    fallback: true,
  },
  Hnakook: {
    productMatch: "Hankook Dynapro (all-terrain class)",
    sourceLabel: "Continental CrossContact LX25 official fallback — Hankook product CDN blocked",
    url: IMG.continentalCrossContact,
    fallback: true,
  },
  Federal: {
    productMatch: "Federal tire (generic)",
    sourceLabel: "Generic tire fallback (Unsplash)",
    url: IMG.genericTire,
    fallback: true,
  },
  "GT Radial": {
    productMatch: "GT Radial tire (generic)",
    sourceLabel: "Generic tire fallback (Unsplash)",
    url: IMG.genericTire,
    fallback: true,
  },
  Sailun: {
    productMatch: "Sailun tire (generic)",
    sourceLabel: "Generic tire fallback (Unsplash)",
    url: IMG.genericTire,
    fallback: true,
  },
};

function slugToFilename(slug: string): string {
  return slug.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TireProImageBot/1.0)",
      Accept: "image/*,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 1024) {
    throw new Error(`Downloaded image too small (${buffer.length} bytes) from ${url}`);
  }
  return buffer;
}

async function saveAsWebp(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(outputPath);
}

async function verifyImageFile(filePath: string): Promise<void> {
  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) {
    throw new Error(`Invalid image dimensions for ${filePath}`);
  }
}

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "tires");
  await mkdir(uploadsDir, { recursive: true });

  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const beforeCount = products.length;
  const results: Array<{
    name: string;
    slug: string;
    productMatch: string;
    sourceLabel: string;
    imageUrl: string;
    localFile: string;
    skipped: boolean;
    fallback: boolean;
  }> = [];

  for (const product of products) {
    const assignment = slugAssignments[product.slug];
    if (!assignment) {
      throw new Error(`No image assignment configured for slug: ${product.slug}`);
    }

    const filename = `${slugToFilename(product.slug)}.webp`;
    const localFilePath = path.join(uploadsDir, filename);
    const publicUrl = `/uploads/tires/${filename}`;

    const alreadyLocal =
      product.imageUrl === publicUrl && (await fileExists(localFilePath));

    if (alreadyLocal) {
      await verifyImageFile(localFilePath);
      results.push({
        name: product.name,
        slug: product.slug,
        productMatch: assignment.productMatch,
        sourceLabel: assignment.sourceLabel,
        imageUrl: publicUrl,
        localFile: localFilePath,
        skipped: true,
        fallback: Boolean(assignment.fallback),
      });
      continue;
    }

    const buffer = await downloadImage(assignment.url);
    await saveAsWebp(buffer, localFilePath);
    await verifyImageFile(localFilePath);

    const before = { ...product };
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: publicUrl },
    });

    if (
      updated.name !== before.name ||
      updated.slug !== before.slug ||
      updated.brand !== before.brand ||
      updated.description !== before.description ||
      updated.category !== before.category ||
      updated.active !== before.active ||
      updated.price !== before.price ||
      updated.size !== before.size ||
      updated.type !== before.type
    ) {
      throw new Error(`Non-image fields changed for ${product.slug}`);
    }

    results.push({
      name: product.name,
      slug: product.slug,
      productMatch: assignment.productMatch,
      sourceLabel: assignment.sourceLabel,
      imageUrl: publicUrl,
      localFile: localFilePath,
      skipped: false,
      fallback: Boolean(assignment.fallback),
    });
  }

  const after = await prisma.product.findMany({ where: { category: "TIRE" } });
  if (after.length !== beforeCount) {
    throw new Error(`Tire product count changed: ${beforeCount} -> ${after.length}`);
  }

  const broken: string[] = [];
  for (const item of results) {
    if (!(await fileExists(item.localFile))) {
      broken.push(item.slug);
    }
  }
  if (broken.length > 0) {
    throw new Error(`Missing local files: ${broken.join(", ")}`);
  }

  const reportPath = path.join(process.cwd(), "scripts", "tire-image-assignments.json");
  await writeFile(reportPath, JSON.stringify({ success: true, assignments: results }, null, 2));

  console.log(JSON.stringify({ success: true, updated: results.filter((r) => !r.skipped).length, skipped: results.filter((r) => r.skipped).length, assignments: results }, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });