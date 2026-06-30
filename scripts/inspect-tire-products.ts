import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });
  console.log(JSON.stringify(products, null, 2));
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