import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { getOpenElection, getLatestElection } from "@/lib/db/elections";
import { getSiteSettings } from "@/lib/site-settings";
import { isElectionResultsFinal } from "@/lib/election-utils";
import { eq } from "drizzle-orm";
import ResultsLive from "./ResultsLive";
import ResultsElectionPicker from "./ResultsElectionPicker";
import ResultsPrintTrigger from "./ResultsPrintTrigger";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ electionId?: string; print?: string }>;
}) {
  const { electionId: electionIdParam, print: printParam } = await searchParams;
  const { schoolName, logoUrl } = await getSiteSettings();
  const allElections = await db
    .select({ id: elections.id, name: elections.name, academicYear: elections.academicYear })
    .from(elections)
    .orderBy(elections.id);
  const openElection = await getOpenElection();
  const latestElection = await getLatestElection();
  const election =
    electionIdParam != null && electionIdParam !== ""
      ? (await db.select().from(elections).where(eq(elections.id, parseInt(electionIdParam, 10))).limit(1))[0] ?? null
      : openElection ?? latestElection ?? (allElections[0] ? (await db.select().from(elections).where(eq(elections.id, allElections[0].id)).limit(1))[0] ?? null : null);
  const now = new Date();
  const isFinal = election ? isElectionResultsFinal(election, now) : false;
  if (!election) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
        <header className="border-b border-[#dbe0e6] bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#1a2432]">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between">
            <Link href="/login" className="flex items-center gap-3 text-[#136dec]">
              {logoUrl ? (
                <img src="/api/site-logo" alt="" width={40} height={40} className="h-10 w-auto object-contain" />
              ) : (
                <span className="material-symbols-outlined text-2xl">how_to_vote</span>
              )}
              <span className="text-lg font-bold text-[#111418] dark:text-white">{schoolName || "Student Govt"}</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-6 py-8">
          <p className="text-[#617289] dark:text-gray-400">No active election.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="results-page min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <header className="no-print border-b border-[#dbe0e6] bg-white px-6 py-4 dark:border-gray-700 dark:bg-[#1a2432]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link href="/login" className="flex items-center gap-3 text-[#136dec]">
            {logoUrl ? (
              <img src="/api/site-logo" alt="" width={40} height={40} className="h-10 w-auto object-contain" />
            ) : (
              <span className="material-symbols-outlined text-2xl">how_to_vote</span>
            )}
            <span className="text-lg font-bold text-[#111418] dark:text-white">{schoolName || "Student Govt"}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ResultsElectionPicker
              elections={allElections}
              currentElectionId={election.id}
            />
            <ThemeToggle />
            <span className="text-sm text-[#617289] dark:text-gray-400">{election.academicYear}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <ResultsPrintTrigger printNow={printParam === "1"} />
        {printParam === "1" && (
          <p className="print-only mb-4 hidden text-center text-sm text-gray-500 print:block">
            Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        )}
        {isFinal && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Final results — voting has ended.
          </p>
        )}
        <ResultsLive electionId={election.id} electionName={election.name} />
      </main>
    </div>
  );
}
