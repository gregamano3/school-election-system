"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

type SiteSettingsPublic = { schoolName: string; logoUrl: string | null };

export default function SiteSettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettingsPublic;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schoolName, setSchoolName] = useState(initialSettings.schoolName);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings.logoUrl);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a JPG or PNG image", "error");
      return;
    }
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/admin/site-settings/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        setPreviewBlobUrl(null);
        return;
      }
      setLogoUrl(data.data.url);
      showToast("Logo uploaded. Click Save to apply.", "success");
    } catch {
      showToast("Upload failed", "error");
      setPreviewBlobUrl(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName: schoolName.trim() || "School Election", logoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Failed to save", "error");
        return;
      }
      showToast("Settings saved", "success");
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      router.refresh();
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label
          htmlFor="schoolName"
          className="mb-1.5 block text-sm font-medium text-[#111418] dark:text-white"
        >
          School name
        </label>
        <input
          id="schoolName"
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="School Election"
          className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-[#111418] placeholder:text-[#617289] focus:border-[#136dec] focus:outline-none focus:ring-1 focus:ring-[#136dec] dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white dark:placeholder:text-[#a1b0c3]"
        />
        <p className="mt-1 text-xs text-[#617289] dark:text-[#a1b0c3]">
          Shown on the login page and as the site title.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#111418] dark:text-white">
          Logo
        </label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dbe0e6] bg-[#f0f2f4] dark:border-[#2d394a] dark:bg-[#2d394a]">
            {previewBlobUrl || logoUrl ? (
              <img
                src={previewBlobUrl ?? "/api/site-logo"}
                alt="Site logo"
                width={96}
                height={96}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="material-symbols-outlined text-4xl text-[#617289] dark:text-[#a1b0c3]">
                image
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleLogoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm font-medium text-[#111418] transition hover:bg-[#f0f2f4] disabled:opacity-50 dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white dark:hover:bg-[#2d394a]"
            >
              {uploading ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => {
                  if (previewBlobUrl) {
                    URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }
                  setLogoUrl(null);
                }}
                className="text-sm text-[#617289] hover:text-[#136dec] dark:text-[#a1b0c3] dark:hover:text-[#136dec]"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-[#617289] dark:text-[#a1b0c3]">
          JPG or PNG, max 10MB. Converted to WebP when saved. Shown on the login page when set.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[#136dec] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d5bc4] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
