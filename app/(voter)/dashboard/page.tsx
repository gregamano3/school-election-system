import Link from "next/link";
import { auth } from "@/auth";
import { getOpenElection } from "@/lib/db/elections";

export default async function DashboardPage() {
  const session = await auth();
  const active = await getOpenElection();

  return (
    <div className="mx-auto max-w-[1200px] flex-1 px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">
        Dashboard
      </h1>
      <p className="mb-6 text-[#617289] dark:text-gray-400">
        Welcome, {session?.user?.name ?? (session?.user as { studentId?: string })?.studentId}.
      </p>
      {active && (
        <div className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1a2432]">
          <h2 className="mb-2 text-lg font-bold text-[#111418] dark:text-white">
            Active Election: {active.name}
          </h2>
          <p className="mb-4 text-sm text-[#617289] dark:text-gray-400">
            {active.academicYear}
          </p>
          <div className="flex gap-4">
            <Link
              href="/vote"
              className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#136dec]/90"
            >
              Vote now
            </Link>
            <Link
              href="/results"
              className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-bold text-[#136dec] hover:bg-[#f0f2f4] dark:border-gray-700 dark:bg-[#2d394a] dark:hover:bg-[#2d394a]"
            >
              View results
            </Link>
          </div>
        </div>
      )}
      {!active && (
        <p className="text-[#617289] dark:text-gray-400">No active election at the moment.</p>
      )}
    </div>
  );
}
