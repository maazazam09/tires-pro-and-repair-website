import type { SupabaseTire } from "@/lib/supabase-tire-inventory";
import { CallToInquireButton } from "@/components/shared/CallToInquireButton";

function shortDescription(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Contact Tire Pro and Repair for full specs and availability.";
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

export function SupabaseTireCard({ tire }: { tire: SupabaseTire }) {
  return (
    <article className="card flex flex-col">
      <div className="mb-4 flex h-44 items-center justify-center rounded-md bg-[#F3F4F6]">
        {tire.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tire.image_url}
            alt={`${tire.brand} ${tire.model_name}`}
            className="h-full w-full rounded-md object-contain p-3"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-semibold text-metallic">Image coming soon</span>
        )}
      </div>

      <h3 className="font-display break-words text-lg font-bold text-foreground">{tire.brand}</h3>
      <p className="mt-1 break-words text-sm font-semibold text-metallic">{tire.model_name}</p>

      <dl className="mt-4 grid gap-2 text-sm text-metallic">
        <div className="flex justify-between gap-3">
          <dt>Size</dt>
          <dd className="text-right font-semibold text-foreground">{tire.tire_size}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Rim Diameter</dt>
          <dd className="text-right text-foreground">{tire.rim_diameter ? `${tire.rim_diameter}"` : "Ask us"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Availability</dt>
          <dd className="text-right text-foreground">{tire.in_stock ? "In stock" : "Call to confirm"}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-metallic">{shortDescription(tire.description)}</p>

      <CallToInquireButton className="mt-auto pt-5" />
    </article>
  );
}
