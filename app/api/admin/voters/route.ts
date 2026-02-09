import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { voterBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const list = await db.select({
      id: users.id,
      studentId: users.studentId,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch voters" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = voterBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.studentId, parsed.data.studentId)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 409 });
    }
    const passwordHash = await hash(parsed.data.password, 10);
    const [inserted] = await db
      .insert(users)
      .values({
        studentId: parsed.data.studentId,
        name: parsed.data.name ?? null,
        passwordHash,
        role: parsed.data.role,
      })
      .returning();
    await logAudit({
      action: "voter.create",
      entityType: "user",
      entityId: String(inserted?.id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { studentId: inserted?.studentId },
    });
    const { passwordHash: _, ...safe } = inserted!;
    return NextResponse.json({ data: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create voter" }, { status: 500 });
  }
}
