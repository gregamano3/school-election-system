import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getSiteSettings } from "@/lib/site-settings";
import { logger } from "@/lib/logger";

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
    
    // If no logo URL or invalid path, return default logo
    if (!isAllowedLogoPath(logoUrl) || !logoUrl) {
      return serveDefaultLogo();
    }
    
    const baseDir = path.join(process.cwd(), "public", "uploads", "site");
    const filename = path.basename(logoUrl);
    if (!SAFE_FILENAME_REGEX.test(filename)) {
      return serveDefaultLogo();
    }
    
    const filepath = path.join(baseDir, filename);
    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(baseDir))) {
      return serveDefaultLogo();
    }
    
    try {
      const buffer = await fs.readFile(filepath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (fileError) {
      // File doesn't exist, serve default logo
      logger.warn("Site logo file not found, serving default", "site-logo", fileError, { filepath });
      return serveDefaultLogo();
    }
  } catch (e) {
    logger.error("Site logo serve error", "site-logo", e instanceof Error ? e : undefined);
    return serveDefaultLogo();
  }
}

/**
 * Serves the default logo SVG when no custom logo is available
 */
async function serveDefaultLogo(): Promise<NextResponse> {
  try {
    const defaultLogoPath = path.join(process.cwd(), "public", "default-logo.svg");
    const buffer = await fs.readFile(defaultLogoPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    logger.error("Failed to serve default logo", "site-logo", e instanceof Error ? e : undefined);
    // Return a simple SVG as fallback
    const fallbackSvg = `<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="160" rx="20" fill="#136dec"/>
      <text x="80" y="90" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">E</text>
    </svg>`;
    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
