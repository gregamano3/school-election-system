import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parties } from "@/lib/db";
import { eq } from "drizzle-orm";
import { partyBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [row] = await db.select().from(parties).where(eq(parties.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch party" }, { status: 500 });
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
    const parsed = partyBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [updated] = await db
      .update(parties)
      .set({
        electionId: parsed.data.electionId ?? null,
        name: parsed.data.name,
        color: parsed.data.color ?? null,
      })
      .where(eq(parties.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    await logAudit({
      action: "party.update",
      entityType: "party",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: updated.name },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update party" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(parties).where(eq(parties.id, id)).returning({ id: parties.id });
    if (!deleted) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    await logAudit({
      action: "party.delete",
      entityType: "party",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete party" }, { status: 500 });
  }
}
