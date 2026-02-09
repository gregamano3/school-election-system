import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getSiteSettings } from "@/lib/site-settings";

/** Only allow paths under /uploads/site/ with a safe filename (UUID.webp). */
const ALLOWED_LOGO_PREFIX = "/uploads/site/";
const SAFE_FILENAME_REGEX = /^[a-f0-9-]+\.webp$/i;

function isAllowedLogoPath(logoUrl: string | null): boolean {
  if (!logoUrl || typeof logoUrl !== "string") return false;
  if (!logoUrl.startsWith(ALLOWED_LOGO_PREFIX) || logoUrl.includes("..")) return false;
  const filename = logoUrl.slice(ALLOWED_LOGO_PREFIX.length);
  return SAFE_FILENAME_REGEX.test(filename) && filename.length <= 50;
}

/**
 * Serves the current site logo image so it works in all environments.
 * Validates logo path to prevent path traversal and only serves from uploads/site.
 */
export async function GET() {
  try {
    const { logoUrl } = await getSiteSettings();
    if (!isAllowedLogoPath(logoUrl)) {
      return new NextResponse(null, { status: 404 });
    }
    const baseDir = path.join(process.cwd(), "public", "uploads", "site");
    const filename = path.basename(logoUrl);
    if (!SAFE_FILENAME_REGEX.test(filename)) {
      return new NextResponse(null, { status: 404 });
    }
    const filepath = path.join(baseDir, filename);
    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(baseDir))) {
      return new NextResponse(null, { status: 404 });
    }
    const buffer = await fs.readFile(filepath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Site logo serve error:", e);
    return new NextResponse(null, { status: 404 });
  }
}
