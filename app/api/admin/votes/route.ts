import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { votes, candidates, positions, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/db/audit";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    if (!electionId) {
      return NextResponse.json({ error: "electionId required" }, { status: 400 });
    }
    const list = await db
      .select({
        id: votes.id,
        electionId: votes.electionId,
        positionId: votes.positionId,
        candidateId: votes.candidateId,
        userId: votes.userId,
        createdAt: votes.createdAt,
        candidateName: candidates.name,
        positionName: positions.name,
        userStudentId: users.studentId,
      })
      .from(votes)
      .innerJoin(candidates, eq(votes.candidateId, candidates.id))
      .innerJoin(positions, eq(votes.positionId, positions.id))
      .innerJoin(users, eq(votes.userId, users.id))
      .where(eq(votes.electionId, parseInt(electionId, 10)))
      .orderBy(votes.createdAt);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}
