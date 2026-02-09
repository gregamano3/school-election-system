import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load site settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const schoolName = typeof body.schoolName === "string" ? body.schoolName : undefined;
    const logoUrl = body.logoUrl === null || typeof body.logoUrl === "string" ? body.logoUrl : undefined;
    const settings = await updateSiteSettings({ schoolName, logoUrl });
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}
