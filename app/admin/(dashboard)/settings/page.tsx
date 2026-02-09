import { getSiteSettings } from "@/lib/site-settings";
import SiteSettingsForm from "./SiteSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-[#111418] dark:text-white">
        Site Settings
      </h1>
      <p className="mb-6 text-sm text-[#617289] dark:text-[#a1b0c3]">
        Customize the school name and logo shown on the login page and across the site.
      </p>
      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
