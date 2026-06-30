import { config } from "dotenv";
import { readdir, access } from "fs/promises";
import path from "path";

config({ path: ".env.local", override: true });
config({ path: ".env" });

type UploadFile = {
  publicPath: string;
  relativePath: string;
  basename: string;
  basenameLower: string;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function scanUploads(uploadsRoot: string): Promise<UploadFile[]> {
  const files: UploadFile[] = [];

  async function walk(currentDir: string, urlPrefix: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".gitkeep") continue;
      const fullPath = path.join(currentDir, entry.name);
      const nextUrl = `${urlPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(fullPath, nextUrl);
        continue;
      }
      files.push({
        publicPath: nextUrl,
        relativePath: path.relative(uploadsRoot, fullPath).replace(/\\/g, "/"),
        basename: entry.name,
        basenameLower: entry.name.toLowerCase(),
      });
    }
  }

  await walk(uploadsRoot, "/uploads");
  return files;
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findGeneralTiresFile(files: UploadFile[]): UploadFile | undefined {
  return files.find((file) => {
    const key = normalizeKey(file.basename);
    return key === "general-tire" || key === "general-tires" || key === "general-tyre";
  });
}

function findBestFile(files: UploadFile[], slug: string, name: string): UploadFile | undefined {
  const slugKey = normalizeKey(slug);
  const nameKey = normalizeKey(name);

  const exact = files.find((file) => {
    const fileKey = normalizeKey(file.basename);
    return fileKey === slugKey || fileKey === nameKey;
  });
  if (exact) return exact;

  const slugContains = files.filter((file) => normalizeKey(file.basename).includes(slugKey));
  if (slugContains.length === 1) return slugContains[0];

  const nameContains = files.filter((file) => normalizeKey(file.basename).includes(nameKey));
  if (nameContains.length === 1) return nameContains[0];

  return undefined;
}

function sanitizeStoredPath(imageUrl: string): string {
  let value = imageUrl.trim();
  value = value.replace(/^public\//i, "/");
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\\/g, "/");
  return value;
}

async function main() {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const files = await scanUploads(uploadsRoot);
  const generalTiresFile = findGeneralTiresFile(files);

  console.log("=== Upload files scanned ===");
  for (const file of files.sort((a, b) => a.publicPath.localeCompare(b.publicPath))) {
    console.log(`${file.publicPath}  (${file.relativePath})`);
  }

  const { prisma } = await import("../src/lib/prisma");
  const products = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  const fixes: Array<{
    name: string;
    slug: string;
    before: string;
    after: string;
    reason: string;
  }> = [];

  for (const product of products) {
    const before = sanitizeStoredPath(product.imageUrl || "");
    let after = before;
    let reason = "unchanged";

    const isGeneralTires =
      product.name.trim().toLowerCase() === "general tires" ||
      product.name.trim().toLowerCase() === "general tire";

    if (isGeneralTires && generalTiresFile) {
      after = generalTiresFile.publicPath;
      reason = `assigned user-provided General Tires file (${generalTiresFile.basename})`;
    } else {
      const matched = findBestFile(files, product.slug, product.name);
      if (matched) {
        after = matched.publicPath;
        if (after !== before) {
          reason = `matched existing upload file (${matched.basename})`;
        }
      } else if (before.startsWith("/uploads/")) {
        const diskPath = path.join(process.cwd(), "public", before);
        if (!(await fileExists(diskPath))) {
          reason = `stored path has no matching file on disk (${before})`;
        }
      } else if (before) {
        reason = "stored path is not a valid /uploads public URL";
      }
    }

    if (after !== before) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: after },
      });

      if (
        updated.name !== product.name ||
        updated.slug !== product.slug ||
        updated.brand !== product.brand ||
        updated.description !== product.description ||
        updated.category !== product.category
      ) {
        throw new Error(`Non-image fields changed for ${product.slug}`);
      }

      fixes.push({
        name: product.name,
        slug: product.slug,
        before,
        after,
        reason,
      });
    }
  }

  const broken: string[] = [];
  const verified: Array<{ name: string; slug: string; imageUrl: string }> = [];

  const refreshed = await prisma.product.findMany({
    where: { category: "TIRE" },
    orderBy: { name: "asc" },
  });

  for (const product of refreshed) {
    const imageUrl = sanitizeStoredPath(product.imageUrl || "");
    if (!imageUrl.startsWith("/uploads/")) {
      broken.push(`${product.slug}: invalid public path (${imageUrl})`);
      continue;
    }
    const diskPath = path.join(process.cwd(), "public", imageUrl);
    if (!(await fileExists(diskPath))) {
      broken.push(`${product.slug}: missing file for ${imageUrl}`);
      continue;
    }
    verified.push({ name: product.name, slug: product.slug, imageUrl });
  }

  const result = {
    success: broken.length === 0,
    scannedFiles: files.length,
    fixes,
    verified,
    broken,
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