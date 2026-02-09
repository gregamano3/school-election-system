"use client";

import { useState, useEffect, useRef } from "react";
import { CandidateImage } from "@/components/CandidateImage";

type CandidateResult = {
  candidateId: number;
  name: string;
  grade: string | null;
  imageUrl: string | null;
  party: { name: string; color: string | null } | null;
  votes: number;
  percentage: number;
};

type PositionResult = {
  positionId: number;
  positionName: string;
  candidates: CandidateResult[];
  totalVotes: number;
};

type ResultsData = {
  election: { id: number; name: string; academicYear: string };
  totalVotes: number;
  eligibleVoters: number;
  turnoutRate: number;
  byPosition: PositionResult[];
};

export default function ResultsLive({
  electionId,
  electionName,
}: { electionId: number; electionName: string }) {
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `/api/results-sse?electionId=${electionId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.data) {
          setData(parsed.data);
          setLastUpdated(new Date());
        }
        if (parsed.error) setError(parsed.error);
      } catch {
        setError("Failed to parse update");
      }
    };

    es.onerror = () => {
      setError("Connection error");
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [electionId]);

  useEffect(() => {
    if (data) return;
    fetch(`/api/results?electionId=${electionId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setData(res.data);
          setLastUpdated(new Date());
        } else setError(res.error ?? "Failed to load");
      })
      .catch(() => setError("Failed to load"));
  }, [electionId, data]);

  if (error && !data) {
    return <p className="text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-[#617289] dark:text-gray-400">Loading results…</p>;
  }

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">
              Live Results
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-white">
            {electionName}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
            <span className="material-symbols-outlined text-gray-400">schedule</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
          <p className="mb-1 text-sm font-medium text-[#617289] dark:text-gray-400">Total Votes Cast</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold leading-none text-[#111418] dark:text-white">
              {data.totalVotes}
            </p>
          </div>
          <p className="mt-2 text-xs text-gray-400">of {data.eligibleVoters} eligible voters</p>
        </div>
        <div className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
          <p className="mb-1 text-sm font-medium text-[#617289] dark:text-gray-400">Turnout Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold leading-none text-[#111418] dark:text-white">
              {data.turnoutRate}%
            </p>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-[#136dec]"
              style={{ width: `${Math.min(data.turnoutRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {data.byPosition.map((pos) => (
          <div
            key={pos.positionId}
            className="overflow-hidden rounded-xl border border-[#dbe0e6] bg-white shadow-sm dark:border-gray-700 dark:bg-[#1a2432]"
          >
            <div className="border-b border-[#dbe0e6] px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">
                {pos.positionName}
              </h3>
            </div>
            <div className="space-y-6 p-6">
              {pos.candidates.map((c, i) => (
                <div key={c.candidateId} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8ecf1] dark:bg-[#2d394a]">
                        {c.imageUrl ? (
                          <CandidateImage src={c.imageUrl} alt={c.name} size="sm" className="h-full w-full" />
                        ) : (
                          <span className="material-symbols-outlined text-3xl text-[#617289] dark:text-[#a1b0c3]">
                            person
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#111418] dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {c.grade ?? ""} {c.party ? `• ${c.party.name}` : "• Independent"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-[#111418] dark:text-white">{c.votes} votes</p>
                      <p className={`text-xs font-bold ${i === 0 ? "text-[#136dec]" : "text-gray-500 dark:text-gray-400"}`}>
                        {c.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-[#136dec]"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
