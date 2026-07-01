import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "WHEEL" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      size: true,
      type: true,
      category: true,
      imageUrl: true,
      active: true,
    },
  });

  console.log(JSON.stringify({ total: products.length, products }, null, 2));
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
