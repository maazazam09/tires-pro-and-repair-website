import { config } from "dotenv";
import { access } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const replacements = [
  {
    matchLabel: "General Tires / General Tire",
    slug: "General Tires ",
    imageUrl: "/uploads/tires/logos/general tyre.jpeg",
  },
  {
    matchLabel: "Hankook",
    slug: "Hnakook",
    imageUrl: "/uploads/tires/logos/hankook tyre.jpeg",
  },
  {
    matchLabel: "Nexen",
    slug: "Nexen",
    imageUrl: "/uploads/tires/logos/nexen tyre.jpeg",
  },
  {
    matchLabel: "Kumho",
    slug: "Kumho ",
    imageUrl: "/uploads/tires/logos/kumho tyre.jpeg",
  },
];

async function verifyLocalImage(imageUrl: string) {
  const localPath = path.join(process.cwd(), "public", imageUrl);
  await access(localPath);
  const metadata = await sharp(localPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Invalid image metadata for ${imageUrl}`);
  }
  return { localPath, width: metadata.width, height: metadata.height };
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const updated: Array<Record<string, unknown>> = [];

  for (const replacement of replacements) {
    const image = await verifyLocalImage(replacement.imageUrl);
    const before = await prisma.product.findFirstOrThrow({
      where: { category: "TIRE", slug: replacement.slug },
    });

    const after = await prisma.product.update({
      where: { id: before.id },
      data: { imageUrl: replacement.imageUrl },
    });

    if (
      after.name !== before.name ||
      after.slug !== before.slug ||
      after.brand !== before.brand ||
      after.description !== before.description ||
      after.category !== before.category ||
      after.active !== before.active ||
      after.price !== before.price ||
      after.size !== before.size ||
      after.type !== before.type
    ) {
      throw new Error(`Non-image field changed for ${before.slug}`);
    }

    updated.push({
      product: before.name,
      slug: before.slug,
      matchLabel: replacement.matchLabel,
      beforeImageUrl: before.imageUrl,
      afterImageUrl: after.imageUrl,
      localPath: image.localPath,
      width: image.width,
      height: image.height,
    });
  }

  console.log(JSON.stringify({ updatedCount: updated.length, updated }, null, 2));
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
