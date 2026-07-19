import { z } from "zod";

export const contactFormSchema = z.object({
  type: z.enum(["contact", "quote"]),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  service: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().min(5, "Please include a message"),
}).superRefine((data, ctx) => {
  if (data.type !== "quote") return;

  if (data.service?.trim().toLowerCase() === "used tires") {
    ctx.addIssue({
      code: "custom",
      path: ["service"],
      message: "Please choose another service.",
    });
  }

  if (!data.service) {
    ctx.addIssue({
      code: "custom",
      path: ["service"],
      message: "Please choose a service",
    });
  }

  if (!data.preferredDate) {
    ctx.addIssue({
      code: "custom",
      path: ["preferredDate"],
      message: "Please choose a date",
    });
  }

  if (!data.preferredTime) {
    ctx.addIssue({
      code: "custom",
      path: ["preferredTime"],
      message: "Please choose a time slot",
    });
  }
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().min(1),
  size: z.string().min(1),
  type: z.enum(["NEW", "USED"]),
  category: z.enum(["TIRE", "WHEEL", "PACKAGE"]),
  price: z.coerce.number().positive(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const tireSizeSchema = z.object({
  width: z.coerce.number().int().min(100).max(455),
  aspectRatio: z.coerce.number().int().min(20).max(95),
  construction: z.string().trim().toUpperCase().regex(/^Z?R$/, "Construction must be R or ZR").default("R"),
  rimDiameter: z.coerce.number().int().min(10).max(30),
  displaySize: z.string().trim().min(5).max(32).optional(),
});

export const tireSizeTextSchema = z.string().trim().regex(
  /^\d{3}\/\d{2}Z?R\d{2}$/i,
  "Tire size must look like 235/35R20 or 235/35ZR20",
);

export const fitmentPositionSchema = z.enum(["GENERAL", "FRONT", "REAR"]);

export const vehicleFitmentCreateSchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  make: z.string().trim().min(1, "Vehicle make is required"),
  model: z.string().trim().min(1, "Vehicle model is required"),
  option: z.string().trim().min(1, "Vehicle option/trim is required"),
  active: z.boolean().default(true),
  tireSizes: z.array(z.object({
    position: fitmentPositionSchema.default("GENERAL"),
    size: tireSizeTextSchema.optional(),
    width: z.coerce.number().int().min(100).max(455).optional(),
    aspectRatio: z.coerce.number().int().min(20).max(95).optional(),
    construction: z.string().trim().toUpperCase().regex(/^Z?R$/, "Construction must be R or ZR").optional(),
    rimDiameter: z.coerce.number().int().min(10).max(30).optional(),
    displaySize: z.string().trim().min(5).max(32).optional(),
  })).min(1, "At least one tire size is required"),
});

export const vehicleFitmentUpdateSchema = vehicleFitmentCreateSchema.extend({
  id: z.string().trim().min(1),
});

export const tireProductSizeLinkSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  productSlug: z.string().trim().min(1).optional(),
  size: tireSizeTextSchema.optional(),
  width: z.coerce.number().int().min(100).max(455).optional(),
  aspectRatio: z.coerce.number().int().min(20).max(95).optional(),
  construction: z.string().trim().toUpperCase().regex(/^Z?R$/, "Construction must be R or ZR").optional(),
  rimDiameter: z.coerce.number().int().min(10).max(30).optional(),
  displaySize: z.string().trim().min(5).max(32).optional(),
}).refine((data) => data.productId || data.productSlug, {
  message: "productId or productSlug is required",
}).refine((data) => data.size || (data.width && data.aspectRatio && data.rimDiameter), {
  message: "Provide a tire size string or width/aspectRatio/rimDiameter",
});

export const tireProductDetailSchema = z.object({
  model: z.string().trim().optional().default(""),
  secondaryImage: z.string().trim().optional().default(""),
  sku: z.string().trim().optional().default(""),
  width: z.coerce.number().int().min(100).max(455).optional().or(z.literal("")),
  aspectRatio: z.coerce.number().int().min(20).max(95).optional().or(z.literal("")),
  construction: z.string().trim().toUpperCase().regex(/^Z?R$/, "Construction must be R or ZR").optional().default("R"),
  rimDiameter: z.coerce.number().int().min(10).max(30).optional().or(z.literal("")),
  tireSize: z.string().trim().optional().default(""),
  loadIndex: z.string().trim().optional().default(""),
  speedRating: z.string().trim().optional().default(""),
  serviceDescription: z.string().trim().optional().default(""),
  season: z.string().trim().optional().default(""),
  warrantyMiles: z.coerce.number().int().min(0).optional().or(z.literal("")),
  warrantyText: z.string().trim().optional().default(""),
  videoUrl: z.string().trim().optional().default(""),
  promotionAvailable: z.boolean().default(false),
  promotionText: z.string().trim().optional().default(""),
  requestQuoteEnabled: z.boolean().default(true),
});

export const bulkTireProductSizeLinkSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1),
  size: tireSizeTextSchema.optional(),
  width: z.coerce.number().int().min(100).max(455).optional(),
  aspectRatio: z.coerce.number().int().min(20).max(95).optional(),
  construction: z.string().trim().toUpperCase().regex(/^Z?R$/, "Construction must be R or ZR").optional(),
  rimDiameter: z.coerce.number().int().min(10).max(30).optional(),
  displaySize: z.string().trim().min(5).max(32).optional(),
}).refine((data) => data.size || (data.width && data.aspectRatio && data.rimDiameter), {
  message: "Provide a tire size string or width/aspectRatio/rimDiameter",
});

export const serviceSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const collectionSectionSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  title: z.string().min(1),
  imageUrl: z.string().optional(),
  itemName: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const reviewSchema = z.object({
  author: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(1),
  source: z.string().default("Google"),
  active: z.boolean().default(true),
});

export const couponSchema = z.object({
  title: z.string().min(1),
  code: z.string().optional(),
  description: z.string().min(1),
  expiresAt: z.string().optional(),
  active: z.boolean().default(true),
});

export const heroSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  ctaCallLabel: z.string().min(1),
  ctaQuoteLabel: z.string().min(1),
  ctaQuoteLink: z.string().min(1),
});

export const settingsSchema = z.object({
  businessName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  hoursJson: z.string(),
  instagramUrl: z.string(),
  facebookUrl: z.string(),
  whatsappNumber: z.string(),
  googleAnalytics: z.string(),
  tagline: z.string(),
  aboutContent: z.string(),
  logoUrl: z.string(),
  averageRating: z.coerce.number(),
  reviewCount: z.coerce.number().int(),
  openSevenDays: z.boolean(),
  financing: z.boolean(),
});

export const pageSeoSchema = z.object({
  path: z.string().min(1),
  metaTitle: z.string().min(1),
  metaDescription: z.string().min(1),
});
