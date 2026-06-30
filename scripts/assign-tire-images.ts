import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const IMG = {
  generic:
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=80",
  stack:
    "https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80",
  passenger:
    "https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80",
  allTerrain:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  offRoad:
    "https://images.unsplash.com/photo-1625047509168-a7023f36a8e0?w=1200&q=80",
  used: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=1200&q=80",
} as const;

type ImageKey = keyof typeof IMG;

const slugImageMap: Record<string, ImageKey> = {
  "bfg-at-265-70r17": "allTerrain",
  BFGoodrich: "allTerrain",
  "michelin-defender-225-65r17": "passenger",
  michelin: "passenger",
  "used-215-55r17": "used",
  Pirelli: "passenger",
  Continental: "passenger",
  bridgestone: "passenger",
  Nitto: "offRoad",
  Falken: "allTerrain",
  Cooper: "allTerrain",
  Firestone: "allTerrain",
  GOODYEAR: "allTerrain",
  "General Tires ": "allTerrain",
  Toyo: "passenger",
  Yokohama: "passenger",
  Hnakook: "stack",
  "Kumho ": "stack",
  Nexen: "stack",
  Federal: "stack",
  "GT Radial": "stack",
  Sailun: "stack",
  maxxis: "allTerrain",
};

function resolveImageKey(slug: string, name: string, brand: string, type: string): ImageKey {
  if (slugImageMap[slug]) return slugImageMap[slug];

  const haystack = `${name} ${brand}`.toLowerCase();
  if (type === "USED" || haystack.includes("used")) return "used";
  if (haystack.includes("all-terrain") || haystack.includes("all terrain") || haystack.includes("at ")) {
    return "allTerrain";
  }

  return "generic";
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const before = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const beforeCount = before.length;
  const beforeIds = new Set(before.map((p) => p.id));
  const results: Array<{ name: string; slug: string; imageUrl: string; imageKey: ImageKey }> = [];

  for (const product of before) {
    const imageKey = resolveImageKey(product.slug, product.name, product.brand, product.type);
    const imageUrl = IMG[imageKey];

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        size: true,
        type: true,
        category: true,
        price: true,
        description: true,
        active: true,
        imageUrl: true,
      },
    });

    const unchanged =
      updated.name === product.name &&
      updated.slug === product.slug &&
      updated.brand === product.brand &&
      updated.size === product.size &&
      updated.type === product.type &&
      updated.category === product.category &&
      updated.price === product.price &&
      updated.description === product.description &&
      updated.active === product.active;

    if (!unchanged) {
      throw new Error(`Non-image fields changed for product ${product.slug}`);
    }

    results.push({ name: updated.name, slug: updated.slug, imageUrl: updated.imageUrl, imageKey });
  }

  const after = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  if (after.length !== beforeCount) {
    throw new Error(`Tire product count changed: before=${beforeCount}, after=${after.length}`);
  }

  for (const product of after) {
    if (!beforeIds.has(product.id)) {
      throw new Error(`Unexpected tire product after update: ${product.slug}`);
    }
    if (!product.imageUrl) {
      throw new Error(`Missing imageUrl after update: ${product.slug}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        updatedCount: results.length,
        assignments: results,
      },
      null,
      2,
    ),
  );
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