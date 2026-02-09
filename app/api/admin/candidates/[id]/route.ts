import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { candidates } from "@/lib/db";
import { eq } from "drizzle-orm";
import { candidateBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [row] = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const body = await req.json();
    const parsed = candidateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [updated] = await db
      .update(candidates)
      .set({
        positionId: parsed.data.positionId,
        partyId: parsed.data.partyId ?? null,
        name: parsed.data.name,
        grade: parsed.data.grade ?? null,
        bio: parsed.data.bio ?? null,
        imageUrl: parsed.data.imageUrl && parsed.data.imageUrl !== "" ? parsed.data.imageUrl : null,
      })
      .where(eq(candidates.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    await logAudit({
      action: "candidate.update",
      entityType: "candidate",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: updated.name },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(candidates).where(eq(candidates.id, id)).returning({ id: candidates.id });
    if (!deleted) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    await logAudit({
      action: "candidate.delete",
      entityType: "candidate",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
