"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { upsertTireProductDetail } from "@/lib/tires";
import {
  heroSchema, settingsSchema, productSchema, serviceSchema, collectionSectionSchema, reviewSchema, couponSchema, pageSeoSchema,
} from "@/lib/validators";
import { buildHoursJson } from "@/lib/constants";

type ActionResult = { success: boolean; message: string };

async function guard() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized. Please log in again.");
  }
  return session;
}

function actionError(error: unknown, fallback: string): ActionResult {
  return {
    success: false,
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function updateHero(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const data = heroSchema.parse({
      headline: formData.get("headline"),
      subheadline: formData.get("subheadline"),
      mediaUrl: formData.get("mediaUrl"),
      mediaType: formData.get("mediaType"),
      ctaCallLabel: formData.get("ctaCallLabel"),
      ctaQuoteLabel: formData.get("ctaQuoteLabel"),
      ctaQuoteLink: formData.get("ctaQuoteLink"),
    });
    await prisma.hero.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    revalidatePath("/");
    return { success: true, message: "Hero banner saved." };
  } catch (error) {
    return actionError(error, "Failed to save hero banner.");
  }
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  try {
    await guard();

    const openingTime = (formData.get("openingTime") as string | null) || "9AM";
    const closingTime = (formData.get("closingTime") as string | null) || "6PM";
    const hoursJson = buildHoursJson(openingTime, closingTime);
    const heroHeadline = String(formData.get("heroHeadline") || "").trim();
    const heroSubheadline = String(formData.get("heroSubheadline") || "").trim();

    const data = settingsSchema.parse({
      businessName: formData.get("businessName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zip: formData.get("zip"),
      hoursJson,
      instagramUrl: formData.get("instagramUrl"),
      facebookUrl: formData.get("facebookUrl"),
      whatsappNumber: formData.get("whatsappNumber"),
      googleAnalytics: formData.get("googleAnalytics"),
      tagline: formData.get("tagline"),
      aboutContent: formData.get("aboutContent"),
      logoUrl: formData.get("logoUrl"),
      averageRating: formData.get("averageRating"),
      reviewCount: formData.get("reviewCount"),
      openSevenDays: formData.get("openSevenDays") === "on",
      financing: formData.get("financing") === "on",
    });

    await prisma.$transaction([
      prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } }),
      prisma.hero.upsert({
        where: { id: 1 },
        update: {
          ...(heroHeadline ? { headline: heroHeadline } : {}),
          ...(heroSubheadline ? { subheadline: heroSubheadline } : {}),
        },
        create: {
          id: 1,
          headline: heroHeadline || "New Tires • Used Tires • Custom Wheels – Get Back on the Road Today!",
          subheadline: heroSubheadline || "Best Prices in Chico | Financing Available | Same-Day Service",
        },
      }),
    ]);

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true, message: "Settings saved successfully." };
  } catch (error) {
    return actionError(error, "Failed to save settings.");
  }
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    let savedProductId = "";
    let savedCategory = "";

    if (id) {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Product not found.");
      }

      const data = productSchema.parse({
        name: readFormText(formData, "name", existing.name),
        slug: readFormText(formData, "slug", existing.slug),
        brand: readFormText(formData, "brand", existing.brand),
        size: readFormText(formData, "size", existing.size),
        type: readFormText(formData, "type", existing.type),
        category: readFormText(formData, "category", existing.category),
        price: formData.has("price") ? formData.get("price") : existing.price,
        imageUrl: formData.has("imageUrl") ? formData.get("imageUrl") || "" : existing.imageUrl,
        description: formData.has("description") ? formData.get("description") || "" : existing.description,
        active: formData.has("active") ? formData.get("active") === "on" : existing.active,
      });
      const product = await prisma.product.update({ where: { id }, data });
      savedProductId = product.id;
      savedCategory = product.category;
    } else {
      const data = productSchema.parse({
        name: formData.get("name"),
        slug: formData.get("slug"),
        brand: formData.get("brand"),
        size: formData.get("size"),
        type: formData.get("type"),
        category: formData.get("category"),
        price: formData.get("price"),
        imageUrl: formData.get("imageUrl") || "",
        description: formData.get("description") || "",
        active: formData.has("active") ? formData.get("active") === "on" : true,
      });
      const product = await prisma.product.create({ data });
      savedProductId = product.id;
      savedCategory = product.category;
    }

    if (savedCategory === "TIRE" && formData.has("tireDetail")) {
      await upsertTireProductDetail(savedProductId, {
        model: formData.get("tireModel"),
        secondaryImage: formData.get("secondaryImage"),
        sku: formData.get("sku"),
        width: formData.get("width") || "",
        aspectRatio: formData.get("aspectRatio") || "",
        construction: formData.get("construction") || "R",
        rimDiameter: formData.get("rimDiameter") || "",
        tireSize: formData.get("tireSize") || "",
        loadIndex: formData.get("loadIndex"),
        speedRating: formData.get("speedRating"),
        serviceDescription: formData.get("serviceDescription"),
        season: formData.get("season"),
        warrantyMiles: formData.get("warrantyMiles") || "",
        warrantyText: formData.get("warrantyText"),
        videoUrl: formData.get("videoUrl"),
        promotionAvailable: formData.get("promotionAvailable") === "on",
        promotionText: formData.get("promotionText"),
        requestQuoteEnabled: formData.get("requestQuoteEnabled") === "on",
      });
    }

    revalidatePath("/shop");
    revalidatePath("/collections/tires");
    revalidatePath("/collections/wheels");
    return { success: true, message: "Product saved." };
  } catch (error) {
    return actionError(error, "Failed to save product.");
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.product.delete({ where: { id } });
    revalidatePath("/shop");
    revalidatePath("/collections/tires");
    revalidatePath("/collections/wheels");
    return { success: true, message: "Product deleted." };
  } catch (error) {
    return actionError(error, "Failed to delete product.");
  }
}

function readFormText(formData: FormData, key: string, fallback: string) {
  if (!formData.has(key)) return fallback;
  const value = String(formData.get(key) ?? "").trim();
  return value || fallback;
}

export async function saveService(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    let previousSlug = "";
    let nextSlug = "";

    if (id) {
      const existing = await prisma.service.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Service not found.");
      }
      previousSlug = existing.slug;

      const patch = {
        title: readFormText(formData, "title", existing.title),
        slug: readFormText(formData, "slug", existing.slug),
        summary: readFormText(formData, "summary", existing.summary),
        content: readFormText(formData, "content", existing.content),
      };
      nextSlug = patch.slug;

      serviceSchema.parse({
        ...patch,
        imageUrl: existing.imageUrl,
        sortOrder: existing.sortOrder,
        active: existing.active,
      });

      const data: typeof patch & { imageUrl?: string; sortOrder?: number; active?: boolean } = { ...patch };

      if (formData.has("imageUrl")) {
        data.imageUrl = String(formData.get("imageUrl") ?? "");
      }
      if (formData.has("sortOrder") && formData.get("sortOrder") !== "" && formData.get("sortOrder") !== null) {
        data.sortOrder = Number(formData.get("sortOrder"));
      }
      if (formData.has("active")) {
        data.active = formData.get("active") === "on";
      }

      await prisma.service.update({ where: { id }, data });
    } else {
      const data = serviceSchema.parse({
        title: formData.get("title"),
        slug: formData.get("slug"),
        summary: formData.get("summary"),
        content: formData.get("content"),
        imageUrl: formData.get("imageUrl") || "",
        sortOrder: formData.get("sortOrder"),
        active: formData.has("active") ? formData.get("active") === "on" : true,
      });
      nextSlug = data.slug;
      await prisma.service.create({ data });
    }

    revalidatePath("/services");
    if (previousSlug) revalidatePath(`/services/${previousSlug}`);
    if (nextSlug) revalidatePath(`/services/${nextSlug}`);
    revalidatePath("/");
    return { success: true, message: "Service saved." };
  } catch (error) {
    return actionError(error, "Failed to save service.");
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    await guard();
    const service = await prisma.service.delete({ where: { id } });
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    revalidatePath("/");
    return { success: true, message: "Service deleted." };
  } catch (error) {
    return actionError(error, "Failed to delete service.");
  }
}

export async function saveCollectionSection(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const originalKey = String(formData.get("originalKey") || formData.get("key") || "");
    const data = collectionSectionSchema.parse({
      key: formData.get("key"),
      title: formData.get("title"),
      imageUrl: formData.get("imageUrl") || "",
      itemName: formData.get("itemName"),
      description: formData.get("description"),
      sortOrder: formData.get("sortOrder"),
      active: formData.get("active") === "on",
    });

    if (originalKey && originalKey !== data.key) {
      await prisma.collectionSection.delete({ where: { key: originalKey } });
      await prisma.collectionSection.create({ data });
      revalidatePath(`/collections/${originalKey}`);
    } else {
      await prisma.collectionSection.upsert({
        where: { key: data.key },
        update: data,
        create: data,
      });
    }

    revalidatePath("/");
    revalidatePath(`/collections/${data.key}`);
    revalidatePath("/admin/collections");
    return { success: true, message: `${data.title} collection saved.` };
  } catch (error) {
    return actionError(error, "Failed to save collection.");
  }
}

export async function saveGalleryItem(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    const data = {
      mediaUrl: formData.get("mediaUrl") as string,
      mediaType: (formData.get("mediaType") as string) || "image",
      caption: (formData.get("caption") as string) || "",
      featured: formData.get("featured") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    };
    if (id) {
      await prisma.galleryItem.update({ where: { id }, data });
    } else {
      await prisma.galleryItem.create({ data });
    }
    revalidatePath("/gallery");
    return { success: true, message: "Gallery item saved." };
  } catch (error) {
    return actionError(error, "Failed to save gallery item.");
  }
}

export async function deleteGalleryItem(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.galleryItem.delete({ where: { id } });
    revalidatePath("/gallery");
    return { success: true, message: "Gallery item deleted." };
  } catch (error) {
    return actionError(error, "Failed to delete gallery item.");
  }
}

export async function saveReview(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    const existing = id ? await prisma.review.findUnique({ where: { id } }) : null;
    const data = reviewSchema.parse({
      author: formData.get("author"),
      rating: formData.get("rating"),
      text: formData.get("text"),
      source: formData.get("source"),
      active: formData.has("active") ? formData.get("active") === "on" : existing?.active ?? true,
    });
    if (id) {
      await prisma.review.update({ where: { id }, data });
    } else {
      await prisma.review.create({ data });
    }
    revalidatePath("/reviews");
    return { success: true, message: "Review saved." };
  } catch (error) {
    return actionError(error, "Failed to save review.");
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.review.delete({ where: { id } });
    revalidatePath("/reviews");
    return { success: true, message: "Review deleted." };
  } catch (error) {
    return actionError(error, "Failed to delete review.");
  }
}

export async function saveCoupon(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    const existing = id ? await prisma.coupon.findUnique({ where: { id } }) : null;
    const expiresRaw = formData.get("expiresAt") as string;
    const data = couponSchema.parse({
      title: formData.get("title"),
      code: formData.get("code"),
      description: formData.get("description"),
      active: formData.has("active") ? formData.get("active") === "on" : existing?.active ?? true,
    });
    const payload = {
      ...data,
      expiresAt: expiresRaw ? new Date(expiresRaw) : null,
    };
    if (id) {
      await prisma.coupon.update({ where: { id }, data: payload });
    } else {
      await prisma.coupon.create({ data: payload });
    }
    revalidatePath("/offers");
    return { success: true, message: "Coupon saved." };
  } catch (error) {
    return actionError(error, "Failed to save coupon.");
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/offers");
    return { success: true, message: "Coupon deleted." };
  } catch (error) {
    return actionError(error, "Failed to delete coupon.");
  }
}

export async function savePageSEO(formData: FormData): Promise<ActionResult> {
  try {
    await guard();
    const id = formData.get("id") as string | null;
    const data = pageSeoSchema.parse({
      path: formData.get("path"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
    });
    if (id) {
      await prisma.pageSEO.update({ where: { id }, data });
    } else {
      await prisma.pageSEO.create({ data });
    }
    return { success: true, message: "SEO entry saved." };
  } catch (error) {
    return actionError(error, "Failed to save SEO entry.");
  }
}
