import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const before = await prisma.product.findFirstOrThrow({
    where: { category: "WHEEL", slug: "Vision Wheel" },
  });
  const after = await prisma.product.update({
    where: { id: before.id },
    data: { imageUrl: "/uploads/wheels/logos/vision wheel.jpeg" },
  });
  console.log(JSON.stringify({ before: before.imageUrl, after: after.imageUrl }, null, 2));
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