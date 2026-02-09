import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { votes } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/db/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(votes).where(eq(votes.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    await logAudit({
      action: "vote.delete",
      entityType: "vote",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { electionId: deleted.electionId, positionId: deleted.positionId, candidateId: deleted.candidateId, userId: deleted.userId },
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete vote" }, { status: 500 });
  }
}
