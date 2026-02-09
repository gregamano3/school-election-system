import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { elections, positions, parties } from "@/lib/db";
import { eq } from "drizzle-orm";
import AdminElectionOptions from "./AdminElectionOptions";
import AdminElectionSetup from "./AdminElectionSetup";

export default async function AdminElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id, 10);
  const [election] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!election) notFound();
  const positionsList = await db.select().from(positions).where(eq(positions.electionId, id)).orderBy(positions.orderIndex, positions.id);
  const partiesList = await db.select().from(parties).where(eq(parties.electionId, id)).orderBy(parties.id);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111418] dark:text-white">
            {election.name}
          </h1>
          <p className="text-sm text-[#617289] dark:text-[#a1b0c3]">{election.academicYear}</p>
        </div>
        <Link
          href="/admin/elections"
          className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-bold hover:bg-[#f0f2f4] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:bg-[#2d394a]"
        >
          Back
        </Link>
      </div>
      <AdminElectionOptions
        election={{
          id: election.id,
          name: election.name,
          academicYear: election.academicYear,
          startDate: election.startDate.toISOString(),
          endDate: election.endDate.toISOString(),
          isActive: election.isActive,
          code: election.code,
        }}
      />
      <AdminElectionSetup
        electionId={id}
        isActive={election.isActive}
        positions={positionsList}
        parties={partiesList}
      />
    </div>
  );
}
