import { and, eq, lte, gte, desc } from "drizzle-orm";
import { db, elections } from "./index";
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

/** Most recent election by end date (for showing results when none is open). */
export async function getLatestElection(): Promise<Election | null> {
  const [e] = await db
    .select()
    .from(elections)
    .orderBy(desc(elections.endDate))
    .limit(1);
  return e ?? null;
}
