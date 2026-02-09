import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";

export async function GET() {
  try {
    const list = await db.select().from(elections).orderBy(elections.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 });
  }
}
