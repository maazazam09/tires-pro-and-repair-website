"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Hero, SiteSettings } from "@/generated/prisma/browser";
import { AdminField } from "@/components/admin/AdminField";
import { updateSettings } from "@/lib/actions";

type AdminSettingsFormProps = {
  settings: SiteSettings;
  hero: Hero;
  openingTime: string;
  closingTime: string;
};

export function AdminSettingsForm({ settings, hero, openingTime, closingTime }: AdminSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await updateSettings(formData);
        if (!result.success) {
          setStatus(result.message);
          return;
        }
        setStatus(result.message);
        setFormKey((current) => current + 1);
        router.refresh();
      } catch {
        setStatus("Failed to save settings. Please try again.");
      }
    });
  }

  return (
    <form key={formKey} onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-4">
      <AdminField label="Business Name" name="businessName" id="businessName" defaultValue={settings.businessName} />
      <AdminField label="Phone" name="phone" id="phone" defaultValue={settings.phone} />
      <AdminField label="Email" name="email" id="email" defaultValue={settings.email} />
      <AdminField label="Address" name="address" id="address" defaultValue={settings.address} />
      <AdminField label="City" name="city" id="city" defaultValue={settings.city} />
      <AdminField label="State" name="state" id="state" defaultValue={settings.state} />
      <AdminField label="ZIP" name="zip" id="zip" defaultValue={settings.zip} />

      <div className="rounded border border-border bg-white/5 p-4">
        <label className="mb-2 block text-sm font-semibold text-white">Shop Hours</label>
        <AdminField label="Opening Time" name="openingTime" id="openingTime" defaultValue={openingTime} />
        <AdminField label="Closing Time" name="closingTime" id="closingTime" defaultValue={closingTime} />
        <label className="mt-3 flex items-center gap-2 text-sm text-metallic">
          <input
            id="openSevenDays"
            type="checkbox"
            name="openSevenDays"
            defaultChecked={settings.openSevenDays}
          />
          Open 7 Days a Week
        </label>
        <p className="mt-2 text-sm text-metallic">
          These hours apply to every day of the week and are shown individually on the site (Monday through Sunday).
        </p>
      </div>

      <AdminField label="Logo URL" name="logoUrl" id="logoUrl" defaultValue={settings.logoUrl} />
      <AdminField label="Hero Title" name="heroHeadline" id="heroHeadline" defaultValue={hero.headline} />
      <AdminField label="Hero Subtitle" name="heroSubheadline" id="heroSubheadline" defaultValue={hero.subheadline} />
      <AdminField label="Instagram URL" name="instagramUrl" id="instagramUrl" defaultValue={settings.instagramUrl} />
      <AdminField label="Facebook URL" name="facebookUrl" id="facebookUrl" defaultValue={settings.facebookUrl} />
      <AdminField label="WhatsApp Number" name="whatsappNumber" id="whatsappNumber" defaultValue={settings.whatsappNumber} />
      <AdminField label="Google Analytics ID" name="googleAnalytics" id="googleAnalytics" defaultValue={settings.googleAnalytics} />
      <AdminField label="Tagline" name="tagline" id="tagline" defaultValue={settings.tagline} />
      <AdminField label="About Content" name="aboutContent" id="aboutContent" defaultValue={settings.aboutContent} rows={6} />
      <AdminField label="Average Rating" name="averageRating" id="averageRating" type="number" defaultValue={settings.averageRating} />
      <AdminField label="Review Count" name="reviewCount" id="reviewCount" type="number" defaultValue={settings.reviewCount} />
      <label className="flex items-center gap-2 text-sm text-metallic">
        <input id="financing" type="checkbox" name="financing" defaultChecked={settings.financing} />
        Financing Available
      </label>
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </button>
      {status ? <p className="text-sm font-semibold text-accent">{status}</p> : null}
    </form>
  );
}