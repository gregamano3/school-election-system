import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { positions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getOpenElection } from "@/lib/db/elections";
import VoteStepper from "./VoteStepper";

export default async function VotePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const election = await getOpenElection();
  if (!election) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-10">
        <p className="text-[#617289] dark:text-gray-400">No election open for voting at this time.</p>
      </div>
    );
  }
  const positionsList = await db
    .select()
    .from(positions)
    .where(eq(positions.electionId, election.id))
    .orderBy(positions.orderIndex, positions.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">
        Vote — {election.name}
      </h1>
      <VoteStepper
        electionId={election.id}
        positions={positionsList}
      />
    </div>
  );
}
