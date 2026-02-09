import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { votes, elections, candidates, positions, electionAllowedGroups, userGroups } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { voteBodySchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = voteBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const { electionId, positionId, candidateId } = parsed.data;
    const userId = parseInt(session.user.id, 10);

    const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (!election) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return NextResponse.json({ error: "Election is not open for voting" }, { status: 400 });
    }
    if (!election.isActive) return NextResponse.json({ error: "Election is inactive" }, { status: 400 });

    const allowedGroupIds = await db
      .select({ groupId: electionAllowedGroups.groupId })
      .from(electionAllowedGroups)
      .where(eq(electionAllowedGroups.electionId, electionId));
    if (allowedGroupIds.length > 0) {
      const ids = allowedGroupIds.map((r) => r.groupId);
      const inGroup = await db
        .select({ userId: userGroups.userId })
        .from(userGroups)
        .where(and(eq(userGroups.userId, userId), inArray(userGroups.groupId, ids)))
        .limit(1);
      if (inGroup.length === 0) {
        return NextResponse.json({ error: "You are not eligible to vote in this election" }, { status: 403 });
      }
    }

    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
    if (!candidate || candidate.positionId !== positionId) {
      return NextResponse.json({ error: "Candidate not found or does not belong to position" }, { status: 400 });
    }

    const [position] = await db.select().from(positions).where(eq(positions.id, positionId)).limit(1);
    if (!position || position.electionId !== electionId) {
      return NextResponse.json({ error: "Position not found or does not belong to election" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.positionId, positionId), eq(votes.electionId, electionId)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Already voted for this position", data: existing[0] }, { status: 409 });
    }

    const [inserted] = await db
      .insert(votes)
      .values({ electionId, positionId, candidateId, userId })
      .returning();
    return NextResponse.json({ data: inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}
