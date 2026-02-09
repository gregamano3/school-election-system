import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { getOpenElection, getLatestElection } from "@/lib/db/elections";
import AdminVotesPageClient from "./AdminVotesPageClient";

export default async function AdminVotesPage() {
  const allElections = await db
    .select({ id: elections.id, name: elections.name, academicYear: elections.academicYear })
    .from(elections)
    .orderBy(elections.id);
  const openOrLatest = await getOpenElection() ?? await getLatestElection();
  const defaultElectionId = openOrLatest?.id ?? null;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-[#111418] dark:text-white">
        Votes (audit)
      </h1>
      <AdminVotesPageClient elections={allElections} defaultElectionId={defaultElectionId} />
    </div>
  );
}
