import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const all = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  const active = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log("ALL_COUNT", all.length);
  console.log("ACTIVE_COUNT", active.length);
  console.log("ALL", JSON.stringify(all, null, 2));
  console.log(
    "MISSING_ON_FRONTEND",
    all
      .filter((s) => !s.active || !s.title?.trim() || !s.slug?.trim() || !s.summary?.trim() || !s.content?.trim())
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        active: s.active,
        sortOrder: s.sortOrder,
        empty: {
          title: !s.title?.trim(),
          slug: !s.slug?.trim(),
          summary: !s.summary?.trim(),
          content: !s.content?.trim(),
        },
      })),
  );

  const slugs = all.map((s) => s.slug);
  const duplicateSlugs = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
  console.log("DUPLICATE_SLUGS", duplicateSlugs);
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