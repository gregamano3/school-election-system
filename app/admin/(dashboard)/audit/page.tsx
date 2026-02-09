import { db } from "@/lib/db";
import { auditLog } from "@/lib/db";
import { desc } from "drizzle-orm";

export default async function AdminAuditPage() {
  const list = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-[#111418] dark:text-white">
        Audit Log
      </h1>
      <div className="overflow-x-auto rounded-xl border border-[#dbe0e6] bg-white dark:border-[#2d394a] dark:bg-[#1a2433]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
              <th className="p-4 font-bold text-[#111418] dark:text-white">Time</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Action</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Entity</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Entity ID</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">User ID</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Payload</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
                <td className="p-4 text-[#111418] dark:text-white">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="p-4 text-[#111418] dark:text-white">{row.action}</td>
                <td className="p-4 text-[#111418] dark:text-white">{row.entityType}</td>
                <td className="p-4 text-[#111418] dark:text-white">{row.entityId ?? "—"}</td>
                <td className="p-4 text-[#111418] dark:text-white">{row.userId ?? "—"}</td>
                <td className="max-w-xs truncate p-4 text-[#617289] dark:text-[#a1b0c3]">
                  {row.payload ? JSON.stringify(row.payload) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
