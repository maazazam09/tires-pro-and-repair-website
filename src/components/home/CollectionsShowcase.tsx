import Link from "next/link";
import type { CollectionSection } from "@/generated/prisma/browser";

type CollectionsShowcaseProps = {
  sections: CollectionSection[];
};

export function CollectionsShowcase({ sections }: CollectionsShowcaseProps) {
  if (sections.length === 0) return null;

  return (
    <section className="border-t border-border bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2">
          {sections.map((section) => (
            <Link key={section.id} href={`/collections/${section.key}`} className="group">
              <article>
                <h2 className="font-display break-words text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  {section.title}
                </h2>
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-[#F3F4F6] sm:mt-5">
                  {section.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.imageUrl}
                      alt={section.itemName}
                      className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-72"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm font-semibold uppercase text-metallic sm:h-72">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="mt-4 break-words font-display text-xl font-bold uppercase text-foreground sm:mt-5 sm:text-2xl">
                  {section.itemName}
                </h3>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
