import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { elections, electionAllowedGroups, groups } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/db/audit";

const putBodySchema = z.object({ groupIds: z.array(z.number().int().positive()) });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const electionId = parseInt((await params).id, 10);
    const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (!election) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    const links = await db
      .select({ groupId: electionAllowedGroups.groupId, groupName: groups.name })
      .from(electionAllowedGroups)
      .innerJoin(groups, eq(groups.id, electionAllowedGroups.groupId))
      .where(eq(electionAllowedGroups.electionId, electionId));
    return NextResponse.json({ data: links });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch allowed groups" }, { status: 500 });
  }
}

/** Replace allowed groups for this election. Empty array = no restriction (all voters). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const electionId = parseInt((await params).id, 10);
    const [election] = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (!election) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    const body = await req.json();
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    await db.delete(electionAllowedGroups).where(eq(electionAllowedGroups.electionId, electionId));
    if (parsed.data.groupIds.length > 0) {
      await db.insert(electionAllowedGroups).values(
        parsed.data.groupIds.map((groupId) => ({ electionId, groupId }))
      );
    }
    await logAudit({
      action: "election.allowed_groups.update",
      entityType: "election",
      entityId: String(electionId),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { groupIds: parsed.data.groupIds },
    });
    const links = await db
      .select({ groupId: electionAllowedGroups.groupId, groupName: groups.name })
      .from(electionAllowedGroups)
      .innerJoin(groups, eq(groups.id, electionAllowedGroups.groupId))
      .where(eq(electionAllowedGroups.electionId, electionId));
    return NextResponse.json({ data: links });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update allowed groups" }, { status: 500 });
  }
}
