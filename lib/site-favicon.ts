import path from "path";
import sharp from "sharp";
import { getSiteSettings } from "./site-settings";
import { logger } from "./logger";

const FAVICON_SIZE = 32;

/**
 * Returns a PNG buffer suitable for use as favicon (32x32).
 * Uses the site logo if set; otherwise returns a simple default icon.
 */
export async function getFaviconBuffer(): Promise<{ buffer: Buffer; contentType: string }> {
  const { logoUrl } = await getSiteSettings();

  if (logoUrl && logoUrl.startsWith("/") && !logoUrl.startsWith("//")) {
    const filepath = path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""));
    try {
      const buffer = await sharp(filepath)
        .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      return { buffer, contentType: "image/png" };
    } catch (e) {
      logger.debug("Favicon: failed to read site logo, using default", "favicon", { error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Default: simple 32x32 PNG (ballot-style icon: rounded rect + check)
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#136dec"/>
      <path d="M10 16l4 4 8-8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  return { buffer, contentType: "image/png" };
}
