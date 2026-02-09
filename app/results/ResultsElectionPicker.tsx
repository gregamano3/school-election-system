"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Election = { id: number; name: string; academicYear: string };

export default function ResultsElectionPicker({
  elections,
  currentElectionId,
}: {
  elections: Election[];
  currentElectionId: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (elections.length <= 1) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("electionId", id);
    } else {
      params.delete("electionId");
    }
    router.push(`/results?${params.toString()}`);
  }

  const value = currentElectionId ?? (elections[0]?.id ?? "");

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-[#617289] dark:text-[#a1b0c3]">Election:</span>
      <select
        value={value}
        onChange={handleChange}
        className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-1.5 text-sm font-medium text-[#111418] dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
      >
        {elections.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.academicYear})
          </option>
        ))}
      </select>
    </label>
  );
}
