import { and, eq, lte, gte, desc, inArray } from "drizzle-orm";
import { db, elections, electionAllowedGroups, userGroups } from "./index";
import type { Election } from "./schema";

/** Election that is open for voting right now (isActive + within start/end). Override: admin edits dates or isActive. */
export async function getOpenElection(now: Date = new Date()): Promise<Election | null> {
  const [e] = await db
    .select()
    .from(elections)
    .where(
      and(
        eq(elections.isActive, 1),
        lte(elections.startDate, now),
        gte(elections.endDate, now)
      )
    )
    .limit(1);
  return e ?? null;
}

/** Open election only if the user is allowed to vote (no allowed groups = everyone; otherwise user must be in at least one allowed group). */
export async function getOpenElectionForUser(
  userId: number,
  now: Date = new Date()
): Promise<Election | null> {
  const election = await getOpenElection(now);
  if (!election) return null;
  const allowed = await db
    .select({ groupId: electionAllowedGroups.groupId })
    .from(electionAllowedGroups)
    .where(eq(electionAllowedGroups.electionId, election.id));
  if (allowed.length === 0) return election;
  const groupIds = allowed.map((r) => r.groupId);
  const inGroup = await db
    .select({ userId: userGroups.userId })
    .from(userGroups)
    .where(and(eq(userGroups.userId, userId), inArray(userGroups.groupId, groupIds)))
    .limit(1);
  return inGroup.length > 0 ? election : null;
}

/** Most recent election by end date (for showing results when none is open). */
export async function getLatestElection(): Promise<Election | null> {
  const [e] = await db
    .select()
    .from(elections)
    .orderBy(desc(elections.endDate))
    .limit(1);
  return e ?? null;
}
