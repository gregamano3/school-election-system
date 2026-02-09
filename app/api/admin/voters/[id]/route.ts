import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { logAudit } from "@/lib/db/audit";

const updateVoterSchema = z.object({
  name: z.string().max(255).optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(["voter", "admin"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [row] = await db.select({
      id: users.id,
      studentId: users.studentId,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch voter" }, { status: 500 });
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
    const parsed = updateVoterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const updates: { name?: string; passwordHash?: string; role?: string } = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.role !== undefined) updates.role = parsed.data.role;
    if (parsed.data.password) updates.passwordHash = await hash(parsed.data.password, 10);
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    await logAudit({
      action: "voter.update",
      entityType: "user",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { studentId: updated.studentId },
    });
    const { passwordHash: _, ...safe } = updated;
    return NextResponse.json({ data: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update voter" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    if (!deleted) return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    await logAudit({
      action: "voter.delete",
      entityType: "user",
      entityId: String(id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete voter" }, { status: 500 });
  }
}
