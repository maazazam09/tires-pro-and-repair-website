import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { GalleryItem } from "@/generated/prisma/browser";

export function GalleryTeaser({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-card py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="section-title">Recent Installs</h2>
            <p className="mt-2 text-metallic">Follow @tireproandrepair for the latest builds.</p>
          </div>
          <Link href="/gallery" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            View Gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg bg-background">
              {item.mediaUrl ? (
                <Image src={item.mediaUrl} alt={item.caption || "Wheel install"} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-metallic">No image</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}