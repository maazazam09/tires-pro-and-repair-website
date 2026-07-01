import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import {
  contentTypeForFile,
  normalizeUploadPublicPath,
  readLocalUpload,
} from "@/lib/uploads";

type UploadRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, { params }: UploadRouteContext) {
  try {
    const { path: segments } = await params;
    const relativePath = normalizeUploadPublicPath(segments || []);
    if (!relativePath) {
      return NextResponse.json({ error: "Missing upload path" }, { status: 400 });
    }

    const localBuffer = await readLocalUpload(relativePath);
    if (localBuffer) {
      return new Response(new Uint8Array(localBuffer), {
        status: 200,
        headers: {
          "content-type": contentTypeForFile(relativePath),
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blobPath = `uploads/${relativePath}`;
      const result = await get(blobPath, { access: "public", useCache: true });
      if (result?.statusCode === 200) {
        const headers: Record<string, string> = {
          "cache-control": "public, max-age=31536000, immutable",
        };
        if (result.blob.contentType) headers["content-type"] = result.blob.contentType;
        return new Response(result.stream, { status: 200, headers });
      }
    }

    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  } catch (err) {
    console.error("Upload serve failed:", err);
    return NextResponse.json({ error: "Failed to serve upload" }, { status: 500 });
  }
}