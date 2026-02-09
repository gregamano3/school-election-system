"use client";

import { useState } from "react";
import AdminVotesList from "./AdminVotesList";

type Election = { id: number; name: string; academicYear: string };

export default function AdminVotesPageClient({
  elections,
  defaultElectionId,
}: {
  elections: Election[];
  defaultElectionId: number | null;
}) {
  const [electionId, setElectionId] = useState<number | null>(defaultElectionId);

  const selectedId = electionId ?? defaultElectionId ?? (elections[0]?.id ?? null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#111418] dark:text-white">Election:</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setElectionId(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
          >
            {elections.length === 0 && <option value="">No elections</option>}
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.academicYear})
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedId ? (
        <AdminVotesList electionId={selectedId} />
      ) : (
        <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 dark:border-[#2d394a] dark:bg-[#1a2433]">
          <p className="text-[#617289] dark:text-[#a1b0c3]">Select an election to view votes.</p>
        </div>
      )}
    </>
  );
}
