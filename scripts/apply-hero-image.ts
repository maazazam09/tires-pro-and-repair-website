import { config } from "dotenv";
import { access } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const heroImageUrl = "/uploads/hero.png";

async function main() {
  const localPath = path.join(process.cwd(), "public", heroImageUrl);
  await access(localPath);
  const metadata = await sharp(localPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Invalid hero image metadata for ${heroImageUrl}`);
  }

  const { prisma } = await import("../src/lib/prisma");
  const before = await prisma.hero.findUnique({ where: { id: 1 } });
  const hero = before ?? (await prisma.hero.create({ data: { id: 1 } }));

  const after = await prisma.hero.update({
    where: { id: 1 },
    data: { mediaUrl: heroImageUrl },
  });

  if (
    after.headline !== hero.headline ||
    after.subheadline !== hero.subheadline ||
    after.mediaType !== hero.mediaType ||
    after.ctaCallLabel !== hero.ctaCallLabel ||
    after.ctaQuoteLabel !== hero.ctaQuoteLabel ||
    after.ctaQuoteLink !== hero.ctaQuoteLink
  ) {
    throw new Error("Non-image hero fields changed.");
  }

  console.log(
    JSON.stringify(
      {
        before: hero.mediaUrl,
        after: after.mediaUrl,
        localPath,
        width: metadata.width,
        height: metadata.height,
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
