import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { generateRandomPassword } from "@/lib/password-utils";
import { logAudit } from "@/lib/db/audit";
import { sanitizeError } from "@/lib/error-utils";
import { logger } from "@/lib/logger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const voterId = parseInt(id, 10);
    if (isNaN(voterId)) {
      return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
    }

    const [voter] = await db.select().from(users).where(eq(users.id, voterId)).limit(1);
    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    const newPassword = generateRandomPassword(8);
    const passwordHash = await hash(newPassword, 10);

    await db
      .update(users)
      .set({ passwordHash, passwordChanged: 0 })
      .where(eq(users.id, voterId));

    await logAudit({
      action: "voter.password_reset",
      entityType: "user",
      entityId: String(voterId),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { studentId: voter.studentId },
    });

    logger.info("Password reset successful", "password-reset", { voterId, adminId: session?.user?.id });
    return NextResponse.json({
      data: {
        newPassword,
        message: "Password reset successfully",
      },
    });
  } catch (e) {
    const { message } = sanitizeError(e, "password-reset");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
