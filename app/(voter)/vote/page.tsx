import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { elections, positions, electionAllowedGroups, userGroups } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import VoteStepper from "./VoteStepper";

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ electionId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = parseInt(session.user.id, 10);
  const params = await searchParams;

  if (!params.electionId) {
    redirect("/election-code");
  }

  const electionId = parseInt(params.electionId, 10);
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);

  if (!election) {
    redirect("/election-code");
  }

  const allowed = await db
    .select({ groupId: electionAllowedGroups.groupId })
    .from(electionAllowedGroups)
    .where(eq(electionAllowedGroups.electionId, election.id));
  
  if (allowed.length > 0) {
    const groupIds = allowed.map((r) => r.groupId);
    const inGroup = await db
      .select({ userId: userGroups.userId })
      .from(userGroups)
      .where(and(eq(userGroups.userId, userId), inArray(userGroups.groupId, groupIds)))
      .limit(1);
    if (inGroup.length === 0) {
      redirect("/election-code");
    }
  }

  const positionsList = await db
    .select()
    .from(positions)
    .where(eq(positions.electionId, election.id))
    .orderBy(positions.orderIndex, positions.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#111418] dark:text-white">
        Vote — {election.name}
      </h1>
      <VoteStepper
        electionId={election.id}
        positions={positionsList}
      />
    </div>
  );
}
