"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import type { Position } from "@/lib/db";

type Candidate = {
  id: number;
  name: string;
  grade: string | null;
  bio: string | null;
  party: { name: string; color: string | null } | null;
};

type Selection = {
  positionId: number;
  positionName: string;
  candidateId: number;
  candidateName: string;
  candidateGrade: string | null;
  partyName: string | null;
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
  const [selections, setSelections] = useState<Record<number, Selection>>({});
  const [countdown, setCountdown] = useState<number | null>(null);

  const isReviewStep = step === positions.length;
  const isCompleteStep = step === -1;
  const position = positions[step];
  const totalSteps = positions.length + 1; // positions + review step
  const progress = positions.length > 0 ? ((step + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    if (!position || isReviewStep || isCompleteStep) return;
    setLoading(true);
    fetch(`/api/candidates?positionId=${position.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCandidates(res.data);
        else setCandidates([]);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [position?.id, isReviewStep, isCompleteStep]);

  function handleNext() {
    if (selected === null || !position) return;
    const candidate = candidates.find((c) => c.id === selected);
    if (!candidate) return;
    
    setSelections((prev) => ({
      ...prev,
      [position.id]: {
        positionId: position.id,
        positionName: position.name,
        candidateId: selected,
        candidateName: candidate.name,
        candidateGrade: candidate.grade,
        partyName: candidate.party?.name ?? null,
      },
    }));
    
    if (step < positions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(positions.length);
    }
  }

  function handlePrev() {
    if (step > 0) {
      setStep(step - 1);
      const prevPosition = positions[step - 1];
      const prevSelection = selections[prevPosition.id];
      if (prevSelection) {
        setSelected(prevSelection.candidateId);
      }
    }
  }

  async function submitAllVotes() {
    setSubmitting(true);
    setError("");
    try {
      const votesToSubmit = Object.values(selections);
      const results = await Promise.all(
        votesToSubmit.map((sel) =>
          fetch("/api/votes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              electionId,
              positionId: sel.positionId,
              candidateId: sel.candidateId,
            }),
          })
        )
      );
      
      const errors = [];
      for (const res of results) {
        const data = await res.json();
        if (!res.ok) {
          errors.push(data.error ?? "Failed to submit vote");
        }
      }
      
      if (errors.length > 0) {
        setError(errors.join("; "));
        setSubmitting(false);
        return;
      }
      
      setStep(-1);
      setCountdown(30);
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      signOut({ redirect: true, callbackUrl: "/login" });
    }
  }, [countdown]);

  useEffect(() => {
    if (position && selections[position.id]) {
      setSelected(selections[position.id].candidateId);
    } else {
      setSelected(null);
    }
  }, [position?.id, selections]);

  if (positions.length === 0) {
    return <p className="text-[#617289] dark:text-gray-400">No positions in this election.</p>;
  }

  if (isCompleteStep) {
    return (
      <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
        <span className="material-symbols-outlined mb-4 text-5xl text-green-500">check_circle</span>
        <h2 className="text-xl font-bold text-[#111418] dark:text-white">Vote submitted successfully</h2>
        <p className="mt-2 text-[#617289] dark:text-gray-400">Thank you for voting.</p>
        {countdown !== null && (
          <div className="mt-6">
            <p className="text-sm text-[#617289] dark:text-gray-400">
              You will be automatically logged out in <strong className="text-[#111418] dark:text-white">{countdown}</strong> seconds.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-[#136dec] transition-all duration-1000"
                  style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isReviewStep) {
    const reviewSelections = Object.values(selections);
    const reviewProgress = (totalSteps / totalSteps) * 100;
    return (
      <>
        <div className="mb-10">
          <div className="mb-3 flex justify-between px-1">
            <span className="text-sm font-semibold text-[#136dec]">Election Progress</span>
            <span className="text-sm font-medium text-[#617289] dark:text-gray-400">
              Step {step + 1} of {totalSteps}: Review
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#136dec] transition-all duration-500"
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
          <h2 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">Review Your Votes</h2>
        <p className="mb-6 text-[#617289] dark:text-gray-400">
          Please review your selections before submitting. You can go back to make changes.
        </p>
        <div className="mb-6 space-y-4">
          {reviewSelections.map((sel) => (
            <div
              key={sel.positionId}
              className="rounded-lg border border-[#dbe0e6] bg-[#f6f7f8] p-4 dark:border-[#2d394a] dark:bg-[#101822]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#111418] dark:text-white">{sel.positionName}</h3>
                  <p className="mt-1 text-lg font-semibold text-[#136dec]">{sel.candidateName}</p>
                  {sel.candidateGrade && (
                    <p className="text-sm text-[#617289] dark:text-gray-400">{sel.candidateGrade}</p>
                  )}
                  {sel.partyName && (
                    <span className="mt-1 inline-block rounded-full bg-[#136dec]/20 px-2 py-0.5 text-xs font-semibold text-[#136dec]">
                      {sel.partyName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(positions.findIndex((p) => p.id === sel.positionId));
                  }}
                  className="text-sm text-[#136dec] hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center justify-between border-t border-[#dbe0e6] pt-6 dark:border-[#2d394a]">
          <button
            type="button"
            onClick={() => setStep(positions.length - 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <button
            type="button"
            onClick={submitAllVotes}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[#136dec] px-10 py-3 font-bold text-white shadow-lg hover:bg-[#136dec]/90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit All Votes"}
            <span className="material-symbols-outlined">check</span>
          </button>
        </div>
      </div>
      </>
    );
  }

  if (!position) return null;

  return (
    <>
      <div className="mb-10">
        <div className="mb-3 flex justify-between px-1">
          <span className="text-sm font-semibold text-[#136dec]">Election Progress</span>
          <span className="text-sm font-medium text-[#617289] dark:text-gray-400">
            Step {step + 1} of {totalSteps}: {position.name}
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
          Vote for {position.name}
        </h2>
        {position.description && (
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
          {step < positions.length - 1 ? "Next" : "Review Votes"}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </>
  );
}
