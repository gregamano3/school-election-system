import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { eq } from "drizzle-orm";
import { electionBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [row] = await db.select().from(elections).where(eq(elections.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch election" }, { status: 500 });
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
    const parsed = electionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [updated] = await db
      .update(elections)
      .set({
        name: parsed.data.name,
        academicYear: parsed.data.academicYear,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        isActive: parsed.data.isActive,
      })
      .where(eq(elections.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    await logAudit({
      action: "election.update",
      entityType: "election",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: updated.name },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update election" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(elections).where(eq(elections.id, id)).returning({ id: elections.id });
    if (!deleted) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    await logAudit({
      action: "election.delete",
      entityType: "election",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete election" }, { status: 500 });
  }
}
