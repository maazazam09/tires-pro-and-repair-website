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
    where: { category: "WHEEL" },
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      brand: true,
      imageUrl: true,
      active: true,
    },
  });

  const issues: string[] = [];
  const verified: Array<{ name: string; slug: string; imageUrl: string; width: number; height: number }> = [];
  const skipped: Array<{ name: string; slug: string; reason: string }> = [];

  for (const product of products) {
    const imageUrl = (product.imageUrl || "").trim();

    if (!imageUrl) {
      skipped.push({ name: product.name, slug: product.slug, reason: "No assigned wheel logo" });
      continue;
    }

    if (!imageUrl.startsWith("/uploads/wheels/logos/")) {
      issues.push(`${product.slug}: non-logo wheel image path (${imageUrl})`);
      continue;
    }

    const localPath = path.join(process.cwd(), "public", imageUrl);
    if (!(await fileExists(localPath))) {
      issues.push(`${product.slug}: missing logo file (${imageUrl})`);
      continue;
    }

    try {
      const metadata = await sharp(localPath).metadata();
      if (!metadata.width || !metadata.height || metadata.width < 80 || metadata.height < 80) {
        issues.push(`${product.slug}: invalid logo dimensions (${imageUrl})`);
        continue;
      }

      verified.push({
        name: product.name,
        slug: product.slug,
        imageUrl,
        width: metadata.width,
        height: metadata.height,
      });
    } catch (error) {
      issues.push(`${product.slug}: unreadable logo file (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  const result = {
    success: issues.length === 0,
    total: products.length,
    verifiedCount: verified.length,
    skippedCount: skipped.length,
    issueCount: issues.length,
    verified,
    skipped,
    issues,
  };

  console.log(JSON.stringify(result, null, 2));
  if (issues.length > 0) process.exit(1);
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
