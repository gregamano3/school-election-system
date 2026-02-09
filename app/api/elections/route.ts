import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (code) {
      const [election] = await db.select().from(elections).where(eq(elections.code, code.trim())).limit(1);
      return NextResponse.json({ data: election ? [election] : [] });
    }
    const list = await db.select().from(elections).orderBy(elections.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 });
  }
}
