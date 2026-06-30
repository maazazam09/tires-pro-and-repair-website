import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/data";
import { phoneToRaw } from "@/lib/phone";

export default async function ThankYouPage() {
  const settings = await getSiteSettings();
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="card max-w-lg text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-accent" />
        <h1 className="mt-6 font-display text-3xl font-bold uppercase text-foreground">Thank You!</h1>
        <p className="mt-3 text-metallic">
          We received your message and will get back to you shortly. Need help right away?
        </p>
        <a href={`tel:${phoneRaw}`} className="btn-primary mt-6 inline-flex">
          Call {settings.phone}
        </a>
        <Link href="/" className="mt-4 block text-sm text-metallic hover:text-foreground">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
