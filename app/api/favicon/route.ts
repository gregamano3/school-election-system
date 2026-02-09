import { NextResponse } from "next/server";
import { getFaviconBuffer } from "@/lib/site-favicon";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { buffer, contentType } = await getFaviconBuffer();
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    logger.error("Favicon serve error", "favicon", e instanceof Error ? e : undefined);
    return new NextResponse(null, { status: 500 });
  }
}
