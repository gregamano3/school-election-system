import { db } from "@/lib/db";
import { votes, candidates, positions, parties, elections, users } from "@/lib/db";
import { eq, sql, and, count } from "drizzle-orm";

const POLL_INTERVAL_MS = 5000;

async function getResults(electionId: number) {
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
  if (!election) return null;

  const positionsList = await db
    .select()
    .from(positions)
    .where(eq(positions.electionId, electionId))
    .orderBy(positions.orderIndex, positions.id);

  const totalVotesResult = await db
    .select({ count: sql<number>`count(distinct ${votes.userId})` })
    .from(votes)
    .where(eq(votes.electionId, electionId));
  const totalVotes = Number(totalVotesResult[0]?.count ?? 0);
  const eligibleCount = await db.select({ count: count() }).from(users).where(eq(users.role, "voter"));
  const eligible = Number(eligibleCount[0]?.count ?? 0);
  const turnoutRate = eligible > 0 ? Math.round((totalVotes / eligible) * 1000) / 10 : 0;

  const byPosition: Array<{
    positionId: number;
    positionName: string;
    candidates: Array<{
      candidateId: number;
      name: string;
      grade: string | null;
      imageUrl: string | null;
      party: { name: string; color: string | null } | null;
      votes: number;
      percentage: number;
    }>;
    totalVotes: number;
  }> = [];

  for (const pos of positionsList) {
    const candidateVotes = await db
      .select({
        candidateId: votes.candidateId,
        votes: count(),
      })
      .from(votes)
      .where(and(eq(votes.electionId, electionId), eq(votes.positionId, pos.id)))
      .groupBy(votes.candidateId);
    const totalPos = candidateVotes.reduce((s, r) => s + Number(r.votes), 0);
    const candidateRows =
      (await db
        .select({
          id: candidates.id,
          name: candidates.name,
          grade: candidates.grade,
          imageUrl: candidates.imageUrl,
          partyId: candidates.partyId,
          partyName: parties.name,
          partyColor: parties.color,
        })
        .from(candidates)
        .leftJoin(parties, eq(candidates.partyId, parties.id))
        .where(eq(candidates.positionId, pos.id))) ?? [];
    const voteMap = new Map(candidateVotes.map((r) => [r.candidateId, Number(r.votes)]));
    const candidatesWithVotes = candidateRows.map((c) => {
      const votesCount = voteMap.get(c.id) ?? 0;
      const percentage = totalPos > 0 ? Math.round((votesCount / totalPos) * 1000) / 10 : 0;
      return {
        candidateId: c.id,
        name: c.name,
        grade: c.grade,
        imageUrl: c.imageUrl ?? null,
        party: c.partyName ? { name: c.partyName, color: c.partyColor } : null,
        votes: votesCount,
        percentage,
      };
    });
    byPosition.push({
      positionId: pos.id,
      positionName: pos.name,
      candidates: candidatesWithVotes.sort((a, b) => b.votes - a.votes),
      totalVotes: totalPos,
    });
  }

  return {
    election: { id: election.id, name: election.name, academicYear: election.academicYear },
    totalVotes,
    eligibleVoters: eligible,
    turnoutRate,
    byPosition,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const electionIdParam = searchParams.get("electionId");
  if (!electionIdParam) {
    return new Response(JSON.stringify({ error: "electionId required" }), { status: 400 });
  }
  const electionId = parseInt(electionIdParam, 10);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream may be closed
        }
      };
      let intervalId: ReturnType<typeof setInterval> | null = null;
      const cleanup = () => {
        if (intervalId) clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      req.signal?.addEventListener?.("abort", cleanup);
      try {
        const data = await getResults(electionId);
        if (data) send({ data });
      } catch (e) {
        send({ error: "Failed to fetch results" });
      }
      intervalId = setInterval(async () => {
        try {
          const data = await getResults(electionId);
          if (data) send({ data });
        } catch (e) {
          send({ error: "Failed to fetch results" });
        }
      }, POLL_INTERVAL_MS);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
