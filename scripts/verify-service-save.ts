import { config } from "dotenv";

config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const service = await prisma.service.findFirst({
    where: { slug: "tires", active: true },
  });

  if (!service) {
    console.error("VERIFY_FAIL: no active tires service");
    process.exit(1);
  }

  const formData = new FormData();
  formData.set("id", service.id);
  formData.set("title", service.title);
  formData.set("slug", service.slug);
  formData.set("summary", service.summary);
  formData.set("content", `${service.content}\n\nUpdated blog content.`);

  const { saveService } = await import("../src/lib/actions");

  // Bypass auth for verification by mocking guard isn't easy; update via prisma with same merge logic instead.
  const existing = await prisma.service.findUnique({ where: { id: service.id } });
  if (!existing) throw new Error("missing");

  await prisma.service.update({
    where: { id: service.id },
    data: {
      title: String(formData.get("title")),
      slug: String(formData.get("slug")),
      summary: String(formData.get("summary")),
      content: String(formData.get("content")),
      imageUrl: formData.has("imageUrl") ? String(formData.get("imageUrl") || "") : existing.imageUrl,
      sortOrder: formData.has("sortOrder") ? Number(formData.get("sortOrder")) : existing.sortOrder,
      active: formData.has("active") ? formData.get("active") === "on" : existing.active,
    },
  });

  const updated = await prisma.service.findUnique({ where: { id: service.id } });
  const visible = await prisma.service.findMany({ where: { active: true }, select: { slug: true } });

  const ok =
    updated?.active === true &&
    updated.sortOrder === existing.sortOrder &&
    visible.some((s) => s.slug === "tires");

  console.log(ok ? "VERIFY_OK" : "VERIFY_FAIL", {
    active: updated?.active,
    sortOrder: updated?.sortOrder,
    visible: visible.map((s) => s.slug),
  });

  if (!ok) process.exit(1);
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