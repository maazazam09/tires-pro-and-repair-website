import { AdminSettingsForm } from "@/app/admin/(panel)/settings/AdminSettingsForm";
import { parseOpeningClosingTimes } from "@/lib/constants";
import { getHero, getSiteSettings } from "@/lib/data";

export default async function AdminSettingsPage() {
  const [settings, hero] = await Promise.all([getSiteSettings(), getHero()]);
  const { openingTime, closingTime } = parseOpeningClosingTimes(settings.hoursJson);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Site Settings</h1>
      <AdminSettingsForm
        settings={settings}
        hero={hero}
        openingTime={openingTime}
        closingTime={closingTime}
      />
    </div>
  );
}