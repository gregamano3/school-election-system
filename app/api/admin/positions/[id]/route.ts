import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { positions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { positionBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [row] = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Position not found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch position" }, { status: 500 });
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
    const parsed = positionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [updated] = await db
      .update(positions)
      .set({
        electionId: parsed.data.electionId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        seatsCount: parsed.data.seatsCount,
        gradeEligibility: parsed.data.gradeEligibility ?? [],
        orderIndex: parsed.data.orderIndex,
      })
      .where(eq(positions.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Position not found" }, { status: 404 });
    await logAudit({
      action: "position.update",
      entityType: "position",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: updated.name },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(positions).where(eq(positions.id, id)).returning({ id: positions.id });
    if (!deleted) return NextResponse.json({ error: "Position not found" }, { status: 404 });
    await logAudit({
      action: "position.delete",
      entityType: "position",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete position" }, { status: 500 });
  }
}
