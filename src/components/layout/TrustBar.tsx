import { Star, Clock, CreditCard } from "lucide-react";
import { SHOP_HOURS_TIME } from "@/lib/constants";

type TrustBarProps = {
  averageRating: number;
  reviewCount: number;
  openSevenDays: boolean;
  financing: boolean;
};

export function TrustBar({ averageRating, reviewCount, openSevenDays, financing }: TrustBarProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:flex-row sm:flex-wrap sm:gap-6 sm:py-3 sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="font-semibold text-foreground">{averageRating}</span>
          <span className="text-metallic">({reviewCount}+ reviews)</span>
        </div>
        {openSevenDays && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-metallic">
            <Clock className="h-4 w-4 text-accent" />
            Open 7 Days · {SHOP_HOURS_TIME}
          </div>
        )}
        {financing && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-metallic">
            <CreditCard className="h-4 w-4 text-accent" />
            Financing Available
          </div>
        )}
      </div>
    </div>
  );
}
