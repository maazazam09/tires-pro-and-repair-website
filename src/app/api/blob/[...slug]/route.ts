import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

type BlobRouteContext = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(_request: Request, { params }: BlobRouteContext) {
  try {
    const { slug } = await params;
    const path = decodeURIComponent((slug || []).join("/"));
    if (!path) return NextResponse.json({ error: "Missing blob path" }, { status: 400 });

    const result = await get(path, { access: "public", useCache: true });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    const headers: Record<string, string> = {};
    const contentType = result.statusCode === 200 ? result.blob.contentType : null;
    if (contentType) headers["content-type"] = contentType;
    return new Response(result.stream, { status: 200, headers });
  } catch (err) {
    console.error("Blob proxy failed:", err);
    return NextResponse.json({ error: "Failed to fetch blob" }, { status: 500 });
  }
}