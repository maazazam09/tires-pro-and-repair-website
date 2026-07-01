import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { TrustBar } from "@/components/layout/TrustBar";
import { getSiteSettings } from "@/lib/data";
import { phoneToRaw } from "@/lib/phone";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const settings = await getSiteSettings();
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <Header
        phone={settings.phone}
        phoneRaw={phoneRaw}
        businessName={settings.businessName}
        logoUrl={settings.logoUrl}
      />
      <TrustBar
        averageRating={settings.averageRating}
        reviewCount={settings.reviewCount}
        openSevenDays={settings.openSevenDays}
        financing={settings.financing}
      />
      <main className="flex-1 overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <Footer
        businessName={settings.businessName}
        phone={settings.phone}
        phoneRaw={phoneRaw}
        address={settings.address}
        city={settings.city}
        state={settings.state}
        zip={settings.zip}
        hoursJson={settings.hoursJson}
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
      />
      <StickyCTA phoneRaw={phoneRaw} />
    </>
  );
}