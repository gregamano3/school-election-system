import Link from "next/link";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { getElectionStatus, getElectionStatusLabel } from "@/lib/election-utils";
import CreateElectionForm from "./CreateElectionForm";

export default async function AdminElectionsPage() {
  const list = await db.select().from(elections).orderBy(elections.id);
  const now = new Date();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-[#111418] dark:text-white">
          Elections
        </h1>
        <CreateElectionForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => {
          const status = getElectionStatus(e, now);
          const statusClass =
            status === "open"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : status === "scheduled"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : status === "ended"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
          return (
            <Link
              key={e.id}
              href={`/admin/elections/${e.id}`}
              className="rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-sm transition hover:border-[#136dec] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:border-[#136dec]"
            >
              <h3 className="font-bold text-[#111418] dark:text-white">{e.name}</h3>
              <p className="text-sm text-[#617289] dark:text-[#a1b0c3]">{e.academicYear}</p>
              <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-bold ${statusClass}`}>
                {getElectionStatusLabel(status)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
