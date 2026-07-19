import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bulkLinkTireProductsToSize, linkTireProductToSize } from "@/lib/tires";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || undefined;
    const productSlug = url.searchParams.get("productSlug") || undefined;

    if (!productId && !productSlug) {
      return NextResponse.json(
        { error: "productId or productSlug is required" },
        { status: 400 },
      );
    }

    const product = productId
      ? await prisma.product.findUnique({
          where: { id: productId },
          include: { tireSizes: { include: { tireSize: true } }, tireDetail: true },
        })
      : await prisma.product.findUnique({
          where: { slug: productSlug },
          include: { tireSizes: { include: { tireSize: true } }, tireDetail: true },
        });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (product.category !== "TIRE") {
      return NextResponse.json({ error: "Only tire products support tire-size links" }, { status: 400 });
    }

    return NextResponse.json({ product, tireSizes: product.tireSizes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve tire product sizes" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    if (Array.isArray(payload.productIds)) {
      const links = await bulkLinkTireProductsToSize(payload);
      return NextResponse.json({ links }, { status: 201 });
    }
    const link = await linkTireProductToSize(payload);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Failed to link tire product to tire size:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to link tire product to tire size" },
      { status: 400 },
    );
  }
}
