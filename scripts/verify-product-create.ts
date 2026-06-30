import { config } from "dotenv";

config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const slug = `verify-product-${Date.now()}`;

  try {
    const created = await prisma.product.create({
      data: {
        name: "Verification Tire",
        slug,
        brand: "Michelin",
        size: "225/65R17",
        type: "NEW",
        category: "TIRE",
        price: 129.99,
        active: true,
      },
    });

    const found = await prisma.product.findUnique({ where: { id: created.id } });
    if (!found) throw new Error("Created product could not be read back");

    await prisma.product.delete({ where: { id: created.id } });
    console.log("VERIFY_OK", slug);
  } catch (error) {
    console.error("VERIFY_FAIL", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();