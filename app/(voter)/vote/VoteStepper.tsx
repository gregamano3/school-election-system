"use client";

import { useState, useEffect } from "react";
import type { Position } from "@/lib/db";

type Candidate = {
  id: number;
  name: string;
  grade: string | null;
  bio: string | null;
  party: { name: string; color: string | null } | null;
};

export default function VoteStepper({
  electionId,
  positions,
}: { electionId: number; positions: Position[] }) {
  const [step, setStep] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [voted, setVoted] = useState<Record<number, number>>({});

  const position = positions[step];
  const progress = positions.length > 0 ? ((step + 1) / positions.length) * 100 : 0;

  useEffect(() => {
    if (!position) return;
    setSelected(null);
    setLoading(true);
    fetch(`/api/candidates?positionId=${position.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCandidates(res.data);
        else setCandidates([]);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [position?.id]);

  async function submitVote() {
    if (!position || selected === null) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId,
          positionId: position.id,
          candidateId: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit vote");
        setSubmitting(false);
        return;
      }
      setVoted((prev) => ({ ...prev, [position.id]: selected }));
      if (step < positions.length - 1) {
        setStep(step + 1);
      } else {
        setStep(-1);
      }
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  }

  function handleNext() {
    if (selected === null) return;
    submitVote();
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  if (positions.length === 0) {
    return <p className="text-[#617289] dark:text-gray-400">No positions in this election.</p>;
  }

  if (step === -1) {
    return (
      <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
        <span className="material-symbols-outlined mb-4 text-5xl text-green-500">check_circle</span>
        <h2 className="text-xl font-bold text-[#111418] dark:text-white">Vote submitted</h2>
        <p className="mt-2 text-[#617289] dark:text-gray-400">Thank you for voting.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <div className="mb-3 flex justify-between px-1">
          <span className="text-sm font-semibold text-[#136dec]">Election Progress</span>
          <span className="text-sm font-medium text-[#617289] dark:text-gray-400">
            Step {step + 1} of {positions.length}: {position?.name}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#136dec] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-10 text-center">
        <h2 className="mb-2 text-3xl font-bold text-[#111418] dark:text-white">
          Vote for {position?.name}
        </h2>
        {position?.description && (
          <p className="mx-auto max-w-xl text-[#617289] dark:text-gray-400">
            {position.description}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-[#617289] dark:text-gray-400">Loading candidates…</p>
      ) : (
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all ${
                selected === c.id
                  ? "border-[#136dec] bg-[#136dec]/5 shadow-lg ring-2 ring-[#136dec]/20 dark:bg-[#136dec]/10"
                  : "border-slate-200 bg-white hover:border-[#136dec]/50 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <h3 className="text-xl font-bold text-[#111418] dark:text-white">{c.name}</h3>
              {c.grade && (
                <p className="text-sm font-semibold text-[#136dec]">{c.grade}</p>
              )}
              {c.party && (
                <span
                  className="mt-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: c.party.color ? `${c.party.color}20` : "#e5e7eb",
                    color: c.party.color ?? "#617289",
                  }}
                >
                  {c.party.name}
                </span>
              )}
              {c.bio && (
                <p className="mt-4 line-clamp-3 flex-grow text-sm italic text-[#617289] dark:text-gray-400">
                  {c.bio}
                </p>
              )}
              <span className="material-symbols-outlined mt-2 text-[#136dec]">
                {selected === c.id ? "radio_button_checked" : "circle"}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <footer className="flex items-center justify-between border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-[#101822]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={selected === null || submitting}
          className="flex items-center gap-2 rounded-lg bg-[#136dec] px-10 py-3 font-bold text-white shadow-lg hover:bg-[#136dec]/90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : step < positions.length - 1 ? "Next" : "Submit vote"}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </>
  );
}
