import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

function readFormText(formData: FormData, key: string, fallback: string) {
  if (!formData.has(key)) return fallback;
  const value = String(formData.get(key) ?? "").trim();
  return value || fallback;
}

async function simulateSave(formData: FormData) {
  const { prisma } = await import("../src/lib/prisma");
  const id = String(formData.get("id"));
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new Error("missing service");

  const patch = {
    title: readFormText(formData, "title", existing.title),
    slug: readFormText(formData, "slug", existing.slug),
    summary: readFormText(formData, "summary", existing.summary),
    content: readFormText(formData, "content", existing.content),
  };

  const data: typeof patch & { imageUrl?: string; sortOrder?: number; active?: boolean } = { ...patch };
  if (formData.has("imageUrl")) data.imageUrl = String(formData.get("imageUrl") ?? "");
  if (formData.has("sortOrder") && formData.get("sortOrder") !== "" && formData.get("sortOrder") !== null) {
    data.sortOrder = Number(formData.get("sortOrder"));
  }
  if (formData.has("active")) data.active = formData.get("active") === "on";

  await prisma.service.update({ where: { id }, data });
  return prisma.service.findUnique({ where: { id } });
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const service = await prisma.service.findUnique({ where: { slug: "tires" } });
  if (!service) throw new Error("tires service missing");

  if (!service.active) {
    await prisma.service.update({ where: { id: service.id }, data: { active: true } });
  }

  for (let i = 1; i <= 3; i++) {
    const formData = new FormData();
    formData.set("id", service.id);
    formData.set("title", service.title);
    formData.set("slug", service.slug);
    formData.set("summary", service.summary);
    formData.set("content", `${service.content}\n\nSave test ${i}.`);
    formData.set("sortOrder", String(service.sortOrder));
    formData.set("active", "on");

    const updated = await simulateSave(formData);
    const visible = await prisma.service.findMany({ where: { active: true, slug: "tires" } });
    console.log(`SAVE_${i}`, {
      active: updated?.active,
      sortOrder: updated?.sortOrder,
      visibleCount: visible.length,
    });
    if (!updated?.active || visible.length !== 1) {
      throw new Error(`Save ${i} hid the service`);
    }
  }

  console.log("VERIFY_3X_OK");
}

main()
  .catch((error) => {
    console.error("VERIFY_3X_FAIL", error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });