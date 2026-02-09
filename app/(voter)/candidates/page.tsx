import Link from "next/link";
import { db } from "@/lib/db";
import { positions, candidates, parties } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getOpenElection } from "@/lib/db/elections";

export default async function CandidatesPage() {
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

  return (
    <div className="mx-auto max-w-[1200px] flex-1 px-4 py-8 md:px-10">
      <nav className="mb-4 flex items-center gap-2 text-sm font-medium text-[#64748b] dark:text-[#a0aec0]">
        <Link href="/dashboard" className="hover:text-[#136dec]">Dashboard</Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-[#136dec]">Candidates</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">
        Candidates — {election.name}
      </h1>
      <div className="space-y-8">
        {positionsList.map((pos) => (
          <PositionCandidates key={pos.id} positionId={pos.id} positionName={pos.name} />
        ))}
      </div>
    </div>
  );
}

async function PositionCandidates({
  positionId,
  positionName,
}: { positionId: number; positionName: string }) {
  const list = await db
    .select({
      id: candidates.id,
      name: candidates.name,
      grade: candidates.grade,
      bio: candidates.bio,
      imageUrl: candidates.imageUrl,
      partyName: parties.name,
      partyColor: parties.color,
    })
    .from(candidates)
    .leftJoin(parties, eq(candidates.partyId, parties.id))
    .where(eq(candidates.positionId, positionId))
    .orderBy(candidates.id);

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-[#111418] dark:text-white">{positionName}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]"
          >
            <div className="mb-3 flex items-center justify-between">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="h-14 w-14 rounded-full object-cover border border-[#dbe0e6] dark:border-gray-600"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f2f4] text-[#617289] dark:bg-[#2d394a] dark:text-[#a1b0c3]">
                  <span className="text-xl font-bold">{c.name.charAt(0)}</span>
                </div>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: c.partyColor ? `${c.partyColor}20` : "#e5e7eb",
                  color: c.partyColor ?? "#617289",
                }}
              >
                {c.partyName ?? "Independent"}
              </span>
            </div>
            <h3 className="font-bold text-[#111418] dark:text-white">{c.name}</h3>
            {c.grade && (
              <p className="text-sm text-[#136dec]">{c.grade}</p>
            )}
            {c.bio && (
              <p className="mt-2 line-clamp-3 text-sm italic text-[#617289] dark:text-gray-400">
                {c.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
