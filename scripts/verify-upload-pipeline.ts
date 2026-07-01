import { config } from "dotenv";
import { access } from "fs/promises";
import path from "path";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const BASE = process.argv[2] || "http://localhost:3000";

async function checkUrl(urlPath: string): Promise<{ ok: boolean; status: number; contentType: string | null }> {
  const res = await fetch(`${BASE}${urlPath}`, { method: "GET" });
  const contentType = res.headers.get("content-type");
  return { ok: res.ok, status: res.status, contentType };
}

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
    where: { category: "TIRE", active: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true, imageUrl: true },
  });

  const excluded = new Set([
    "michelin-defender-225-65r17",
    "bfg-at-265-70r17",
    "used-215-55r17",
  ]);

  const publicProducts = products.filter((p) => !excluded.has(p.slug));
  const broken: string[] = [];
  const verified: Array<{ name: string; imageUrl: string; status: number; contentType: string | null }> = [];

  for (const product of publicProducts) {
    const imageUrl = (product.imageUrl || "").trim();
    if (!imageUrl.startsWith("/uploads/")) {
      broken.push(`${product.name}: invalid imageUrl (${imageUrl})`);
      continue;
    }

    const diskPath = path.join(process.cwd(), "public", imageUrl);
    if (!(await fileExists(diskPath))) {
      broken.push(`${product.name}: missing local file (${imageUrl})`);
    }

    const encodedPath = imageUrl
      .split("/")
      .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
      .join("/");

    const result = await checkUrl(encodedPath);
    if (!result.ok || !result.contentType?.startsWith("image/")) {
      broken.push(`${product.name}: HTTP ${result.status} for ${encodedPath}`);
      continue;
    }

    verified.push({
      name: product.name,
      imageUrl,
      status: result.status,
      contentType: result.contentType,
    });
  }

  const general = products.find((p) => p.name.trim().toLowerCase().startsWith("general tire"));
  const payload = {
    base: BASE,
    useBlobUploads: Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.VERCEL === "1",
    publicProductCount: publicProducts.length,
    verifiedCount: verified.length,
    generalTires: general,
    verified,
    broken,
    success: broken.length === 0,
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