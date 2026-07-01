import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const restores: Record<string, string> = {
  Falken: "/uploads/tires/Falken.webp",
  Sailun: "/uploads/tires/Sailun.webp",
  "used-215-55r17": "/uploads/tires/used-215-55r17.webp",
};

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const results: Array<{ slug: string; imageUrl: string }> = [];

  for (const [slug, imageUrl] of Object.entries(restores)) {
    const before = await prisma.product.findUnique({ where: { slug } });
    if (!before) throw new Error(`Product not found: ${slug}`);

    const updated = await prisma.product.update({
      where: { slug },
      data: { imageUrl },
    });

    if (
      updated.name !== before.name ||
      updated.slug !== before.slug ||
      updated.brand !== before.brand ||
      updated.description !== before.description ||
      updated.category !== before.category
    ) {
      throw new Error(`Non-image fields changed for ${slug}`);
    }

    results.push({ slug, imageUrl: updated.imageUrl });
  }

  console.log(JSON.stringify({ success: true, restored: results }, null, 2));
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