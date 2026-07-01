import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { GalleryItem } from "@/generated/prisma/browser";

export function GalleryTeaser({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-card py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Recent Installs</h2>
            <p className="mt-2 text-sm text-metallic sm:text-base">Follow @tireproandrepair for the latest builds.</p>
          </div>
          <Link href="/gallery" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:underline sm:min-h-0">
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