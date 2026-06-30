import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/data";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Tire Pro and Repair | Chico CA",
    template: "%s | Tire Pro and Repair",
  },
  description: "Best prices on new & used tires, custom wheels, and auto repair in Chico, CA.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <GoogleAnalytics gaId={settings.googleAnalytics} />
        {children}
      </body>
    </html>
  );
}