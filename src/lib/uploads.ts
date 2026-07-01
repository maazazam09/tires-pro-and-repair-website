import { access, readFile } from "fs/promises";
import path from "path";

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
};

export function uploadsRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

export function normalizeUploadPublicPath(segments: string[]): string {
  const decoded = segments.map((segment) => decodeURIComponent(segment));
  const safe = decoded.filter((segment) => segment && segment !== "." && segment !== "..");
  return safe.join("/");
}

export function contentTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export async function readLocalUpload(relativePath: string): Promise<Buffer | null> {
  const root = path.resolve(uploadsRoot());
  const absolute = path.resolve(root, relativePath);
  const outsideRoot = path.relative(root, absolute).startsWith("..");
  if (outsideRoot || path.isAbsolute(path.relative(root, absolute))) return null;

  try {
    await access(absolute);
    return await readFile(absolute);
  } catch {
    return null;
  }
}

export function shouldUseBlobUploads(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.VERCEL === "1";
}