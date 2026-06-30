import { config } from "dotenv";
import { access } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const broken: string[] = [];
  const verified: Array<{ name: string; slug: string; imageUrl: string; width: number; height: number }> = [];

  for (const product of products) {
    if (!product.imageUrl) {
      broken.push(`${product.slug}: missing imageUrl`);
      continue;
    }

    if (!product.imageUrl.startsWith("/uploads/tires/")) {
      broken.push(`${product.slug}: imageUrl not local (${product.imageUrl})`);
      continue;
    }

    const localPath = path.join(process.cwd(), "public", product.imageUrl);
    if (!(await fileExists(localPath))) {
      broken.push(`${product.slug}: file missing (${localPath})`);
      continue;
    }

    const metadata = await sharp(localPath).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) {
      broken.push(`${product.slug}: invalid dimensions`);
      continue;
    }

    verified.push({
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      width: metadata.width,
      height: metadata.height,
    });
  }

  const result = {
    success: broken.length === 0,
    total: products.length,
    verified: verified.length,
    brokenCount: broken.length,
    broken,
    products: verified,
  };

  console.log(JSON.stringify(result, null, 2));
  if (broken.length > 0) process.exit(1);
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