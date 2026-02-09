"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function ElectionCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [electionName, setElectionName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAlreadyVoted(false);
    if (!code.trim()) {
      setError("Please enter an election code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/elections?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.data || data.data.length === 0) {
        setError("Invalid election code");
        setLoading(false);
        return;
      }
      const election = data.data[0];
      
      // Check if user has already voted
      const checkRes = await fetch(`/api/votes/check?electionId=${election.id}`);
      const checkData = await checkRes.json();
      if (checkRes.ok && checkData.data?.hasVoted) {
        setAlreadyVoted(true);
        setElectionName(election.name);
        setLoading(false);
        return;
      }
      
      router.push(`/vote?electionId=${election.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-12">
      <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-2 text-2xl font-bold text-[#111418] dark:text-white">
          Enter Election Code
        </h1>
        <p className="mb-6 text-sm text-[#617289] dark:text-gray-400">
          Enter the election code provided by your school to view candidates and vote.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111418] dark:text-gray-200">
              Election Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-4 py-3 text-base focus:border-[#136dec] focus:ring-[#136dec] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
              autoFocus
              maxLength={8}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {alreadyVoted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    You have already voted
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    You have already submitted your vote for <strong>{electionName}</strong>. Each voter can only vote once per election.
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || alreadyVoted}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#136dec] px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#136dec]/90 focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
