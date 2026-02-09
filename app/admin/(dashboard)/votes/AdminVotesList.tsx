"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";

type Vote = {
  id: number;
  electionId: number;
  positionId: number;
  candidateId: number;
  userId: number;
  createdAt: string;
  candidateName: string;
  positionName: string;
  userStudentId: string;
};

export default function AdminVotesList({ electionId }: { electionId: number }) {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const { confirm: confirmAction, Dialog: ConfirmDialog } = useConfirmDialog();

  const positions = Array.from(new Set(votes.map((v) => v.positionName))).sort();

  useEffect(() => {
    fetch(`/api/admin/votes?electionId=${electionId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setVotes(res.data);
        else setVotes([]);
      })
      .catch(() => showToast("Failed to load votes", "error"))
      .finally(() => setLoading(false));
  }, [electionId]);

  function handleDelete(id: number) {
    confirmAction("Delete this vote? This action will be logged.", () => {
      fetch(`/api/admin/votes/${id}`, { method: "DELETE" })
        .then(async (r) => {
          const data = await r.json();
          if (r.ok && data.data) {
            setVotes((prev) => prev.filter((v) => v.id !== id));
            showToast("Vote deleted", "success");
            router.refresh();
          } else {
            showToast(data.error || "Failed to delete vote", "error");
          }
        })
        .catch(() => showToast("Failed to delete vote", "error"));
    });
  }

  const filteredVotes = votes.filter((v) => {
    const matchesSearch = searchTerm === "" || v.userStudentId.toLowerCase().includes(searchTerm.toLowerCase()) || v.candidateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === "all" || v.positionName === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const stats = {
    total: votes.length,
    byPosition: positions.reduce((acc, pos) => {
      acc[pos] = votes.filter((v) => v.positionName === pos).length;
      return acc;
    }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 dark:border-[#2d394a] dark:bg-[#1a2433]">
        <p className="text-[#617289] dark:text-[#a1b0c3]">Loading votes…</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dbe0e6] bg-white p-4 dark:border-[#2d394a] dark:bg-[#1a2433]">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-bold text-[#111418] dark:text-white">Total votes:</span>{" "}
            <span className="text-[#617289] dark:text-[#a1b0c3]">{stats.total}</span>
          </div>
          {positions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <span key={pos} className="text-xs text-[#617289] dark:text-[#a1b0c3]">
                  {pos}: <span className="font-bold text-[#111418] dark:text-white">{stats.byPosition[pos]}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by student ID or candidate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-1.5 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
          />
          {positions.length > 0 && (
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-1.5 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            >
              <option value="all">All positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#dbe0e6] bg-white dark:border-[#2d394a] dark:bg-[#1a2433]">
        {filteredVotes.length === 0 ? (
          <div className="p-8 text-center text-[#617289] dark:text-[#a1b0c3]">
            {votes.length === 0 ? "No votes recorded yet." : "No votes match your filters."}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
                <th className="p-4 font-bold text-[#111418] dark:text-white">Voter (Student ID)</th>
                <th className="p-4 font-bold text-[#111418] dark:text-white">Position</th>
                <th className="p-4 font-bold text-[#111418] dark:text-white">Candidate</th>
                <th className="p-4 font-bold text-[#111418] dark:text-white">Voted at</th>
                <th className="p-4 font-bold text-[#111418] dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVotes.map((vote) => (
                <tr key={vote.id} className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
                  <td className="p-4 font-mono text-sm text-[#111418] dark:text-white">{vote.userStudentId}</td>
                  <td className="p-4 text-[#111418] dark:text-white">{vote.positionName}</td>
                  <td className="p-4 font-medium text-[#111418] dark:text-white">{vote.candidateName}</td>
                  <td className="p-4 text-[#617289] dark:text-[#a1b0c3]">
                    {new Date(vote.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(vote.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
