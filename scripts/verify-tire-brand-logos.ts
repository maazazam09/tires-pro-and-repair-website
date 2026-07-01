import { config } from "dotenv";
import { access } from "fs/promises";
import path from "path";
import sharp from "sharp";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const BASE = process.argv[2] || "http://localhost:3000";

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
  const verified: Array<{ name: string; slug: string; imageUrl: string; status: number }> = [];

  for (const product of products) {
    const imageUrl = (product.imageUrl || "").trim();
    if (!imageUrl) {
      broken.push(`${product.slug}: missing imageUrl`);
      continue;
    }

    const diskPath = path.join(process.cwd(), "public", imageUrl);
    if (imageUrl.startsWith("/uploads/tires/logos/")) {
      if (!(await fileExists(diskPath))) {
        broken.push(`${product.slug}: missing logo file ${imageUrl}`);
        continue;
      }
      const meta = await sharp(diskPath).metadata();
      if (!meta.width || !meta.height) {
        broken.push(`${product.slug}: invalid logo ${imageUrl}`);
        continue;
      }
    }

    const encoded = imageUrl
      .split("/")
      .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
      .join("/");
    const res = await fetch(`${BASE}${encoded}`);
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
      broken.push(`${product.slug}: HTTP ${res.status} for ${encoded}`);
      continue;
    }

    verified.push({ name: product.name, slug: product.slug, imageUrl, status: res.status });
  }

  const payload = {
    base: BASE,
    total: products.length,
    verified: verified.length,
    broken,
    success: broken.length === 0,
    products: verified,
  };

  console.log(JSON.stringify(payload, null, 2));
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