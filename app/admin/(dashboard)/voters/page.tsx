import { db } from "@/lib/db";
import { users } from "@/lib/db";
import AdminVotersList from "./AdminVotersList";

export default async function AdminVotersPage() {
  const list = await db
    .select({ id: users.id, studentId: users.studentId, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.id);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-[#111418] dark:text-white">
        Voters / Students
      </h1>
      <AdminVotersList initialList={list} />
    </div>
  );
}
