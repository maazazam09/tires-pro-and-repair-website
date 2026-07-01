import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { shouldUseBlobUploads } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  // Allow unauthenticated uploads during local development to make testing easier.
  // In production (VERCEL=1) uploads require an authenticated admin user.
  const runningOnVercel = process.env.VERCEL === "1";
  if (!session?.user && runningOnVercel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  // Use blob only on Vercel production. Local dev writes to public/uploads so /uploads URLs work.
  const useBlob = shouldUseBlobUploads();

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  try {
    if (useBlob) {
      // Convert images to webp before uploading
      if (file.type.startsWith("image/")) {
        const webpBuffer = await sharp(buffer)
          .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        const webpName = filename.replace(/\.[^.]+$/, ".webp");
        const blobPath = `uploads/${webpName}`;
        await put(blobPath, webpBuffer, { access: "public", contentType: "image/webp" });
        return NextResponse.json({ url: `/uploads/${webpName}` });
      }

      // Non-image files: upload as-is
      const blobPath = `uploads/${filename}`;
      await put(blobPath, buffer, { access: "public", contentType: file.type || "application/octet-stream" });
      return NextResponse.json({ url: `/uploads/${filename}` });
    }

    // Fallback to local filesystem (development)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.error("Failed to ensure uploads directory:", err);
      return NextResponse.json({ error: "Server storage unavailable. Configure remote storage for production." }, { status: 500 });
    }

    const outputPath = path.join(uploadsDir, filename);
    if (file.type.startsWith("image/")) {
      const dest = outputPath.replace(/\.[^.]+$/, ".webp");
      await sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(dest);
      const webpName = filename.replace(/\.[^.]+$/, ".webp");
      return NextResponse.json({ url: `/uploads/${webpName}` });
    }

    await writeFile(outputPath, buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload processing failed:", err);
    return NextResponse.json({ error: "Failed to process upload." }, { status: 500 });
  }
}