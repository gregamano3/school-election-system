import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, parties } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get("positionId");
    if (!positionId) {
      return NextResponse.json({ error: "positionId required" }, { status: 400 });
    }
    const list = await db
      .select({
        id: candidates.id,
        positionId: candidates.positionId,
        partyId: candidates.partyId,
        name: candidates.name,
        grade: candidates.grade,
        bio: candidates.bio,
        imageUrl: candidates.imageUrl,
        createdAt: candidates.createdAt,
        partyName: parties.name,
        partyColor: parties.color,
      })
      .from(candidates)
      .leftJoin(parties, eq(candidates.partyId, parties.id))
      .where(eq(candidates.positionId, parseInt(positionId, 10)))
      .orderBy(candidates.id);
    const data = list.map((r) => ({
      ...r,
      party: r.partyName ? { name: r.partyName, color: r.partyColor } : null,
      partyName: undefined,
      partyColor: undefined,
    }));
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}
