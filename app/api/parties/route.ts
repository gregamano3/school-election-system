import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parties } from "@/lib/db";
import { eq, or, isNull } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    const list = electionId
      ? await db
          .select()
          .from(parties)
          .where(eq(parties.electionId, parseInt(electionId, 10)))
          .orderBy(parties.id)
      : await db.select().from(parties).orderBy(parties.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch parties" }, { status: 500 });
  }
}
