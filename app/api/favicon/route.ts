import { NextResponse } from "next/server";
import { getFaviconBuffer } from "@/lib/site-favicon";

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
    console.error(e);
    return new NextResponse(null, { status: 500 });
  }
}
