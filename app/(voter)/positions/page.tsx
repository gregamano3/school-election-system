import Link from "next/link";
import { db } from "@/lib/db";
import { positions, candidates } from "@/lib/db";
import { eq, inArray, count } from "drizzle-orm";
import { getOpenElection } from "@/lib/db/elections";

export default async function PositionsPage() {
  const election = await getOpenElection();
  if (!election) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-10">
        <p className="text-[#617289] dark:text-gray-400">No active election.</p>
      </div>
    );
  }
  const positionsList = await db
    .select()
    .from(positions)
    .where(eq(positions.electionId, election.id))
    .orderBy(positions.orderIndex, positions.id);

  const positionIds = positionsList.map((p) => p.id);
  const counts =
    positionIds.length > 0
      ? await db
          .select({ positionId: candidates.positionId, count: count() })
          .from(candidates)
          .where(inArray(candidates.positionId, positionIds))
          .groupBy(candidates.positionId)
      : [];
  const countMap = new Map(counts.map((r) => [r.positionId, r.count]));

  return (
    <div className="mx-auto max-w-[1200px] flex-1 px-4 py-8 md:px-10">
      <nav className="mb-4 flex items-center gap-2 text-sm font-medium text-[#617289] dark:text-gray-400">
        <Link href="/dashboard" className="hover:text-[#136dec]">Election 2024</Link>
        <span className="font-bold">/</span>
        <span className="text-[#111418] dark:text-white">Positions</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">
        Positions — {election.name}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {positionsList.map((pos) => {
          const n = Number(countMap.get(pos.id)) ?? 0;
          return (
            <Link
              key={pos.id}
              href={`/candidates?positionId=${pos.id}`}
              className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm transition hover:border-[#136dec] dark:border-gray-700 dark:bg-[#1a2432] dark:hover:border-[#136dec]"
            >
              <h3 className="font-bold text-[#111418] dark:text-white">{pos.name}</h3>
              <p className="mt-1 text-sm text-[#617289] dark:text-gray-400">
                {pos.seatsCount} seat{pos.seatsCount !== 1 ? "s" : ""}
              </p>
              <p className="mt-2 text-xs text-[#617289] dark:text-gray-400">
                {n} candidate{n !== 1 ? "s" : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
