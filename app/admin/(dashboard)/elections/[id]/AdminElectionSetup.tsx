"use client";

import { useState, useEffect } from "react";
import type { Position, Party } from "@/lib/db";
import { useInputDialog } from "@/components/InputDialog";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { useCandidateDialog } from "@/components/CandidateDialog";
import { showToast } from "@/components/Toast";

type Candidate = {
  id: number;
  positionId: number;
  partyId: number | null;
  name: string;
  grade: string | null;
  bio: string | null;
  imageUrl: string | null;
  party: { name: string; color: string | null } | null;
};

export default function AdminElectionSetup({
  electionId,
  isActive,
  positions: initialPositions,
  parties: initialParties,
}: {
  electionId: number;
  isActive: number;
  positions: Position[];
  parties: Party[];
}) {
  const canEdit = isActive === 1;
  const [positions, setPositions] = useState(initialPositions);
  const [parties, setParties] = useState(initialParties);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(positions[0]?.id ?? null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const { prompt: promptInput, Dialog: InputDialog } = useInputDialog();
  const { confirm: confirmAction, Dialog: ConfirmDialog } = useConfirmDialog();
  const { open: openCandidate, Dialog: CandidateDialog } = useCandidateDialog();

  useEffect(() => {
    if (!selectedPositionId) return;
    setLoading(true);
    fetch(`/api/admin/candidates?positionId=${selectedPositionId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCandidates(res.data);
        else setCandidates([]);
      })
      .finally(() => setLoading(false));
  }, [selectedPositionId]);

  function addPosition() {
    if (!canEdit) return;
    promptInput(
      "Add position",
      "Position name",
      (name) => {
        fetch("/api/admin/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ electionId, name, seatsCount: 1, orderIndex: positions.length }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.data) {
              setPositions((prev) => [...prev, data.data]);
              setSelectedPositionId(data.data.id);
              showToast("Position added", "success");
            } else {
              showToast(data.error || "Failed to add position", "error");
            }
          });
      },
      { placeholder: "e.g. President" }
    );
  }

  function addParty() {
    if (!canEdit) return;
    promptInput(
      "Add party",
      "Party name",
      (name) => {
        fetch("/api/admin/parties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ electionId, name }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.data) {
              setParties((prev) => [...prev, data.data]);
              showToast("Party added", "success");
            } else {
              showToast(data.error || "Failed to add party", "error");
            }
          });
      },
      { placeholder: "e.g. Student Party" }
    );
  }

  function addCandidate() {
    if (!selectedPositionId || !canEdit) return;
    openCandidate(parties, ({ name, grade, bio, partyId, imageUrl }) => {
      fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: selectedPositionId,
          name,
          grade: grade || null,
          bio: bio || null,
          partyId,
          imageUrl: imageUrl || null,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            const party = partyId ? parties.find((p) => p.id === partyId) : null;
            setCandidates((prev) => [...prev, { ...data.data, party: party ? { name: party.name, color: party.color } : null }]);
            showToast("Candidate added", "success");
          } else {
            showToast(data.error || "Failed to add candidate", "error");
            fetchCandidates();
          }
        });
    });
  }

  function fetchCandidates() {
    if (!selectedPositionId) return;
    fetch(`/api/admin/candidates?positionId=${selectedPositionId}`)
      .then((r) => r.json())
      .then((res) => res.data && setCandidates(res.data));
  }

  async function deleteCandidate(id: number) {
    confirmAction("Delete this candidate?", () => {
      fetch(`/api/admin/candidates/${id}`, { method: "DELETE" })
        .then((r) => {
          if (r.ok) {
            setCandidates((prev) => prev.filter((c) => c.id !== id));
            showToast("Candidate deleted", "success");
          } else {
            showToast("Failed to delete candidate", "error");
          }
        });
    });
  }

  const selectedPosition = positions.find((p) => p.id === selectedPositionId);

  return (
    <>
      <InputDialog />
      <ConfirmDialog />
      <CandidateDialog />
      <div className="flex gap-6">
      <div className="w-1/3 rounded-xl border border-[#dbe0e6] bg-[#f6f7f8] dark:border-[#2d394a] dark:bg-[#101822]">
        <div className="flex items-center justify-between border-b border-[#dbe0e6] p-4 dark:border-[#2d394a]">
          <h3 className="text-sm font-bold text-[#617289] dark:text-[#a1b0c3]">Positions ({positions.length})</h3>
          {canEdit ? (
            <button
              type="button"
              onClick={addPosition}
              className="flex items-center gap-1 text-sm font-bold text-[#136dec] hover:underline"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add
            </button>
          ) : (
            <span className="text-xs text-[#617289] dark:text-[#a1b0c3]">Election inactive</span>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          {positions.map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setSelectedPositionId(pos.id)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedPositionId === pos.id
                  ? "border-[#136dec] bg-white shadow dark:border-[#136dec] dark:bg-[#1a2433]"
                  : "border-transparent bg-white hover:border-[#dbe0e6] dark:bg-[#1a2433] dark:hover:border-[#2d394a]"
              }`}
            >
              <h4 className="font-bold text-[#111418] dark:text-white">{pos.name}</h4>
              <p className="text-xs text-[#617289] dark:text-[#a1b0c3]">{pos.seatsCount} seat(s)</p>
            </button>
          ))}
        </div>
        <div className="border-t border-[#dbe0e6] p-4 dark:border-[#2d394a]">
          <h3 className="mb-2 text-xs font-bold uppercase text-[#617289] dark:text-[#a1b0c3]">Parties</h3>
          {canEdit ? (
            <button
              type="button"
              onClick={addParty}
              className="flex items-center gap-1 text-sm font-bold text-[#136dec] hover:underline"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add party
            </button>
          ) : (
            <span className="text-xs text-[#617289] dark:text-[#a1b0c3]">Election inactive</span>
          )}
          <ul className="mt-2 space-y-1 text-sm text-[#111418] dark:text-white">
            {parties.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-[#dbe0e6] bg-white p-8 dark:border-[#2d394a] dark:bg-[#1a2433]">
        {selectedPosition ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#111418] dark:text-white">
                {selectedPosition.name} — Candidates
              </h2>
              {canEdit ? (
                <button
                  type="button"
                  onClick={addCandidate}
                  className="flex items-center gap-2 rounded-lg bg-[#136dec]/10 px-4 py-2 text-sm font-bold text-[#136dec] hover:bg-[#136dec]/20"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add candidate
                </button>
              ) : (
                <span className="text-xs text-[#617289] dark:text-[#a1b0c3]">Election inactive</span>
              )}
            </div>
            {loading ? (
              <p className="text-[#617289] dark:text-[#a1b0c3]">Loading…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-[#dbe0e6] p-4 dark:border-[#2d394a]"
                  >
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="h-12 w-12 rounded-full object-cover border border-[#dbe0e6] dark:border-[#2d394a]"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f4] text-sm font-bold text-[#617289] dark:bg-[#2d394a] dark:text-[#a1b0c3]">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#111418] dark:text-white">{c.name}</p>
                        <p className="text-xs text-[#617289] dark:text-[#a1b0c3]">
                          {c.grade ?? ""} {c.party ? `• ${c.party.name}` : "• Independent"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCandidate(c.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[#617289] dark:text-[#a1b0c3]">Select a position or add one.</p>
        )}
      </div>
    </div>
    </>
  );
}
