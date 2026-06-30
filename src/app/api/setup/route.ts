import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tireproandrepair.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, passwordHash, name: "Admin" },
    });
    await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    await prisma.hero.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        mediaUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80",
      },
    });

    return NextResponse.json({ success: true, message: "Database seeded. Login at /admin/login" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Setup failed — ensure TURSO env vars are set" }, { status: 500 });
  }
}