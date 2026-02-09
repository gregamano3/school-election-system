/**
 * Election status and date-based open/closed logic.
 * Voting is allowed only when isActive and now is between start and end.
 * Override: admin can edit end date or isActive to extend or close early.
 */

export type ElectionWithDates = {
  isActive: number;
  startDate: Date;
  endDate: Date;
};

export type ElectionStatus = "scheduled" | "open" | "ended" | "inactive";

export function getElectionStatus(election: ElectionWithDates, now: Date = new Date()): ElectionStatus {
  if (election.isActive !== 1) return "inactive";
  if (now < election.startDate) return "scheduled";
  if (now > election.endDate) return "ended";
  return "open";
}

/** True only when voters can cast votes (active + within date range). Override by editing dates or isActive in admin. */
export function isElectionOpenForVoting(election: ElectionWithDates, now: Date = new Date()): boolean {
  return getElectionStatus(election, now) === "open";
}

/** True when results are final (ended or manually inactive). */
export function isElectionResultsFinal(election: ElectionWithDates, now: Date = new Date()): boolean {
  const status = getElectionStatus(election, now);
  return status === "ended" || status === "inactive";
}

export function getElectionStatusLabel(status: ElectionStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "open":
      return "Open";
    case "ended":
      return "Ended";
    case "inactive":
      return "Inactive";
    default:
      return "Unknown";
  }
}
