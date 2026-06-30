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
