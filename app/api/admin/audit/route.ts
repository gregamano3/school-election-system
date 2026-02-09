import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
    const list = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
