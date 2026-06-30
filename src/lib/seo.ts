import type { Metadata } from "next";
import { getPageSEO, getSiteSettings } from "@/lib/data";

export async function buildMetadata(path: string, fallback: { title: string; description: string }): Promise<Metadata> {
  const seo = await getPageSEO(path);
  return {
    title: seo?.metaTitle ?? fallback.title,
    description: seo?.metaDescription ?? fallback.description,
    openGraph: {
      title: seo?.metaTitle ?? fallback.title,
      description: seo?.metaDescription ?? fallback.description,
      type: "website",
    },
  };
}

export async function getLocalBusinessJsonLd() {
  const settings = await getSiteSettings();
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: settings.businessName,
    image: settings.logoUrl || undefined,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressRegion: settings.state,
      postalCode: settings.zip,
      addressCountry: "US",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: settings.averageRating,
      reviewCount: settings.reviewCount,
    },
    url: "https://tireproandrepair.com",
    priceRange: "$$",
  };
}