import { config } from "dotenv";
import { access, readdir } from "fs/promises";
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

async function walkUploads(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === ".gitkeep") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkUploads(full, rel)));
    } else {
      files.push(rel);
    }
  }
  return files;
}

async function main() {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const diskFiles = await walkUploads(uploadsRoot);
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const runningOnVercel = process.env.VERCEL === "1";

  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      brand: true,
      description: true,
      category: true,
    },
  });

  const issues: string[] = [];
  const rows: Array<{
    name: string;
    slug: string;
    imageUrl: string;
    diskMatch: boolean;
    validImage: boolean;
    urlKind: string;
  }> = [];

  for (const product of products) {
    const imageUrl = (product.imageUrl || "").trim();
    let urlKind = "empty";
    if (imageUrl.startsWith("/api/blob/")) urlKind = "blob-proxy";
    else if (imageUrl.startsWith("/uploads/")) urlKind = "public-upload";
    else if (imageUrl.startsWith("http")) urlKind = "remote";
    else if (imageUrl) urlKind = "invalid";

    let diskMatch = false;
    let validImage = false;

    if (imageUrl.startsWith("/uploads/")) {
      const rel = imageUrl.replace(/^\/uploads\//, "");
      diskMatch = diskFiles.some((f) => f.replace(/\\/g, "/") === rel);
      const diskPath = path.join(uploadsRoot, rel);
      if (await fileExists(diskPath)) {
        try {
          const meta = await sharp(diskPath).metadata();
          validImage = Boolean(meta.width && meta.height && meta.width > 0);
        } catch {
          issues.push(`${product.slug}: file exists but is not a valid image (${imageUrl})`);
        }
      } else {
        issues.push(`${product.slug}: DB path missing on disk (${imageUrl})`);
      }
    } else if (imageUrl.startsWith("http")) {
      issues.push(`${product.slug}: still using remote URL (${imageUrl})`);
    } else if (imageUrl && !imageUrl.startsWith("/api/blob/")) {
      issues.push(`${product.slug}: non-public upload path (${imageUrl})`);
    }

    rows.push({ name: product.name, slug: product.slug, imageUrl, diskMatch, validImage, urlKind });
  }

  console.log(
    JSON.stringify(
      {
        env: {
          useBlob,
          runningOnVercel,
          cwd: process.cwd(),
          uploadsRoot,
          diskFileCount: diskFiles.length,
        },
        diskFiles,
        products: rows,
        issues,
      },
      null,
      2,
    ),
  );

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