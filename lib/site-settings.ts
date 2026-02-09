import { db, siteSettings } from "./db";
import { eq } from "drizzle-orm";

const DEFAULT_SCHOOL_NAME = "School Election";

export type SiteSettingsPublic = { schoolName: string; logoUrl: string | null };

export async function getSiteSettings(): Promise<SiteSettingsPublic> {
  const rows = await db.select().from(siteSettings).limit(1);
  const row = rows[0];
  if (!row) {
    return { schoolName: DEFAULT_SCHOOL_NAME, logoUrl: null };
  }
  return {
    schoolName: row.schoolName || DEFAULT_SCHOOL_NAME,
    logoUrl: row.logoUrl ?? null,
  };
}

export async function updateSiteSettings(updates: {
  schoolName?: string;
  logoUrl?: string | null;
}): Promise<SiteSettingsPublic> {
  const rows = await db.select().from(siteSettings).limit(1);
  const row = rows[0];
  const schoolName =
    updates.schoolName !== undefined ? updates.schoolName : row?.schoolName ?? DEFAULT_SCHOOL_NAME;
  const logoUrl = updates.logoUrl !== undefined ? updates.logoUrl : row?.logoUrl ?? null;

  if (row) {
    await db
      .update(siteSettings)
      .set({
        schoolName: schoolName.trim() || DEFAULT_SCHOOL_NAME,
        logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, row.id));
  } else {
    await db.insert(siteSettings).values({
      schoolName: schoolName.trim() || DEFAULT_SCHOOL_NAME,
      logoUrl,
    });
  }
  return getSiteSettings();
}
