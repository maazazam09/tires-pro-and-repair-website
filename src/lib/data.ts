import { prisma } from "@/lib/prisma";

const excludedProductSlugs = [
  "michelin-defender-225-65r17",
  "bfg-at-265-70r17",
  "used-215-55r17",
  "fuel-offroad-20x10",
  "american-racing-torq",
  "mount-balance-package",
];

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: 1 } });
  }
  return settings;
}

export async function getHero() {
  let hero = await prisma.hero.findUnique({ where: { id: 1 } });
  if (!hero) {
    hero = await prisma.hero.create({ data: { id: 1 } });
  }
  return hero;
}

export async function getServices(activeOnly = true) {
  return prisma.service.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({ where: { slug } });
}

export async function getCollectionSections(activeOnly = true) {
  return prisma.collectionSection.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCollectionByKey(key: string) {
  return prisma.collectionSection.findUnique({ where: { key } });
}

export async function getProductsByCategory(category: string, activeOnly = true) {
  const where: { category: string; slug: { notIn: string[] }; active?: boolean } = {
    category,
    slug: { notIn: excludedProductSlugs },
  };
  if (activeOnly) where.active = true;

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProducts(activeOnly = true) {
  const where: { slug: { notIn: string[] }; active?: boolean } = {
    slug: { notIn: excludedProductSlugs },
  };
  if (activeOnly) where.active = true;

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductsForAdmin() {
  return prisma.product.findMany({
    include: {
      tireDetail: true,
      tireSizes: { include: { tireSize: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGalleryItems(limit?: number) {
  return prisma.galleryItem.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getReviews(activeOnly = true) {
  return prisma.review.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { date: "desc" },
  });
}

export async function getCoupons(activeOnly = true) {
  return prisma.coupon.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPageSEO(path: string) {
  return prisma.pageSEO.findUnique({ where: { path } });
}

export async function getFormSubmissions(limit = 20) {
  const { getFormSubmissions: getSubmissions } = await import("@/lib/submissions-store");
  return getSubmissions(limit);
}

export async function getDashboardStats() {
  const { countFormSubmissions } = await import("@/lib/submissions-store");
  const [products, services, gallery, reviews, submissions] = await Promise.all([
    prisma.product.count(),
    prisma.service.count(),
    prisma.galleryItem.count(),
    prisma.review.count({ where: { active: true } }),
    countFormSubmissions(),
  ]);
  return { products, services, gallery, reviews, submissions };
}
