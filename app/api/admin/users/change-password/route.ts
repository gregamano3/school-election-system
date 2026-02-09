import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { logAudit } from "@/lib/db/audit";

const changePasswordSchema = z.object({
  userId: z.number().int().positive(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const { userId, currentPassword, newPassword } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    const newPasswordHash = await hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordChanged: 1,
      })
      .where(eq(users.id, userId));
    await logAudit({
      action: "user.password_change",
      entityType: "user",
      entityId: String(userId),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { studentId: user.studentId },
    });
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
