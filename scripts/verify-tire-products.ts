import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { getProductsByCategory } = await import("../src/lib/data");

  const allTires = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const activePublicTires = await getProductsByCategory("TIRE", true);
  const missingImages = allTires.filter((p) => !p.imageUrl);

  const result = {
    totalTireProducts: allTires.length,
    activePublicTireProducts: activePublicTires.length,
    missingImageCount: missingImages.length,
    allHaveImages: missingImages.length === 0,
    products: allTires.map((p) => ({
      name: p.name,
      slug: p.slug,
      active: p.active,
      imageUrl: p.imageUrl,
    })),
  };

  console.log(JSON.stringify(result, null, 2));

  if (allTires.length !== 23 || missingImages.length > 0) {
    process.exit(1);
  }
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