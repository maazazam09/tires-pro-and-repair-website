import "dotenv/config";
import bcrypt from "bcryptjs";
import { buildHoursJson } from "../src/lib/constants";
import { prisma } from "../src/lib/prisma";

const services = [
  {
    title: "New & Used Tires",
    slug: "tires",
    summary: "Top brands and budget-friendly used tires for every vehicle.",
    content:
      "We stock a wide selection of new tires from trusted brands plus quality inspected used tires at unbeatable Chico prices. Same-day installation available.",
    sortOrder: 1,
  },
  {
    title: "Custom Wheels & Rims",
    slug: "wheels",
    summary: "Stand out with custom wheels — from street to off-road.",
    content:
      "Upgrade your ride with custom wheels and rims. We carry performance, truck, and luxury styles with expert mounting and balancing. Our team will help you select the right wheel width, bolt pattern, and finish for your vehicle, then install and balance them precisely so your car rides smoothly and looks sharp.",
    sortOrder: 2,
  },
  {
    title: "Brake Service",
    slug: "brakes",
    summary: "Pads, rotors, and full brake inspections for safe stopping.",
    content:
      "Complete brake service including pad replacement, rotor resurfacing, and fluid checks. Fast turnaround so you're back on the road safely.",
    sortOrder: 4,
  },
  {
    title: "Wheel Alignment",
    slug: "alignment",
    summary: "Precision alignment for longer tire life and smoother handling.",
    content:
      "State-of-the-art alignment equipment ensures your vehicle tracks straight, tires wear evenly, and you get the best fuel economy.",
    sortOrder: 5,
  },
  {
    title: "Suspension",
    slug: "suspension",
    summary: "Shocks, struts, and lift kits for cars and trucks.",
    content:
      "From daily drivers to lifted trucks, we handle suspension repairs, upgrades, and lift kit installations with precision.",
    sortOrder: 6,
  },
];

const products: Array<{
  name: string;
  slug: string;
  brand: string;
  size: string;
  type: string;
  category: string;
  price: number;
}> = [];

const collectionSections = [
  {
    key: "tires",
    title: "TIRES",
    imageUrl: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=80",
    itemName: "New & Used Tires",
    description:
      "Choose from dependable daily-driver tires, performance options, truck fitments, and budget-friendly used tires.",
    sortOrder: 1,
    active: true,
  },
  {
    key: "wheels",
    title: "WHEELS",
    imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&q=80",
    itemName: "Custom Wheels & Rims",
    description:
      "Upgrade the stance and style of your car or truck with wheel options matched to your vehicle and driving needs.",
    sortOrder: 2,
    active: true,
  },
];

const reviews = [
  { author: "Mike R.", rating: 5, text: "Best prices in Chico hands down. Got four used tires mounted same day. Super friendly crew.", source: "Google" },
  { author: "Sarah T.", rating: 5, text: "They hooked up my Mustang with custom wheels that look incredible. Way better than the big chains.", source: "Google" },
  { author: "James L.", rating: 5, text: "Fast alignment and honest pricing. These guys know their stuff. Highly recommend.", source: "Google" },
  { author: "David K.", rating: 4, text: "Great selection of wheels for my truck. Financing made it easy to get what I wanted.", source: "Google" },
];

const seoPages = [
  { path: "/", metaTitle: "Tire Pro and Repair | Tires & Wheels Chico CA", metaDescription: "Best prices on new & used tires, custom wheels, brakes & alignment in Chico, CA. Same-day service. Call (530) 717-1765." },
  { path: "/services", metaTitle: "Auto Services | Tire Pro and Repair Chico", metaDescription: "Tires, wheels, brakes, alignment, and suspension in Chico, CA. Expert service, competitive pricing." },
  { path: "/shop", metaTitle: "Shop Tires & Wheels | Tire Pro Chico CA", metaDescription: "Browse new and used tires, custom wheels and packages. Best tire prices in Chico. Call for install." },
  { path: "/gallery", metaTitle: "Wheel Install Gallery | Tire Pro Chico", metaDescription: "See our latest custom wheel installs and tire work. Follow @tireproandrepair on Instagram." },
  { path: "/about", metaTitle: "About Us | Tire Pro and Repair Chico", metaDescription: "Local Chico tire shop with better prices than big chains and better service than anyone." },
  { path: "/reviews", metaTitle: "Customer Reviews | Tire Pro Chico", metaDescription: "Read what Chico drivers say about Tire Pro and Repair. 4.9 star rated tire & wheel shop." },
  { path: "/contact", metaTitle: "Contact & Location | Tire Pro Chico CA", metaDescription: "Visit us at 821 Cherry St, Chico CA. Call (530) 717-1765 or book a call online." },
  { path: "/offers", metaTitle: "Special Offers & Coupons | Tire Pro Chico", metaDescription: "Current tire and wheel deals, coupons and promotions at Tire Pro and Repair in Chico, CA." },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tireproandrepair.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Admin" },
  });

  const hoursJson = buildHoursJson("9AM", "6PM");

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, hoursJson, openSevenDays: true },
  });

  await prisma.hero.upsert({
    where: { id: 1 },
    update: {
      mediaUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80",
      ctaQuoteLabel: "Booking",
      ctaQuoteLink: "/contact#booking",
    },
    create: {
      id: 1,
      mediaUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80",
      ctaQuoteLabel: "Booking",
      ctaQuoteLink: "/contact#booking",
    },
  });

  await prisma.service.deleteMany({ where: { slug: "wheel-repair" } });

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  for (const section of collectionSections) {
    await prisma.collectionSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }

  for (const review of reviews) {
    const existing = await prisma.review.findFirst({ where: { author: review.author } });
    if (!existing) {
      await prisma.review.create({ data: review });
    }
  }

  const existingCoupon = await prisma.coupon.findFirst({ where: { code: "CHICO20" } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: {
        title: "$20 Off Any 4-Tire Purchase",
        code: "CHICO20",
        description: "Save $20 when you buy any set of 4 tires. Cannot be combined with other offers.",
        active: true,
      },
    });
  }

  for (const seo of seoPages) {
    await prisma.pageSEO.upsert({
      where: { path: seo.path },
      update: seo,
      create: seo,
    });
  }

  console.log("Seed complete. Admin:", adminEmail);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
