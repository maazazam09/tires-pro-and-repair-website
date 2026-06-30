import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

const defaults = [
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
      "Upgrade your ride with custom wheels and rims. We carry performance, truck, and luxury styles with expert mounting and balancing.",
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

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const before = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  console.log("BEFORE", before.map((s) => ({ slug: s.slug, active: s.active, sortOrder: s.sortOrder })));

  for (const service of defaults) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        active: true,
        sortOrder: service.sortOrder,
        title: service.title,
        summary: service.summary,
      },
      create: { ...service, active: true },
    });
  }

  const reactivated = await prisma.service.updateMany({
    where: { active: false },
    data: { active: true },
  });

  const after = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log("REACTIVATED_COUNT", reactivated.count);
  console.log("ACTIVE_AFTER", after.map((s) => s.slug));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });