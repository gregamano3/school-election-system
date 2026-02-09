import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { votes } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    if (!electionId) {
      return NextResponse.json({ error: "electionId is required" }, { status: 400 });
    }
    const userId = parseInt(session.user.id, 10);
    const electionIdNum = parseInt(electionId, 10);
    const userVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.electionId, electionIdNum)))
      .limit(1);
    return NextResponse.json({ data: { hasVoted: userVotes.length > 0 } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to check vote status" }, { status: 500 });
  }
}
