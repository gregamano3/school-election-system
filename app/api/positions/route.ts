import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    if (!electionId) {
      return NextResponse.json({ error: "electionId required" }, { status: 400 });
    }
    const list = await db
      .select()
      .from(positions)
      .where(eq(positions.electionId, parseInt(electionId, 10)))
      .orderBy(positions.orderIndex, positions.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
  }
}
