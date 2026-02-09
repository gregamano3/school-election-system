import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userGroups, groups } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { bulkRangeBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function randomPassword(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return s;
}

/** Generate student_id as YY-NNNN (year_enrolled 2 digits, hyphen, student number). */
function formatStudentId(yearEnrolled: number, studentNumber: number): string {
  const yy = String(yearEnrolled).padStart(2, "0");
  return `${yy}-${studentNumber}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bulkRangeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const { yearEnrolled, startNumber, endNumber, groupId } = parsed.data;

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const created: string[] = [];
    const skipped: string[] = [];
    const total = endNumber - startNumber + 1;
    if (total > 50_000) {
      return NextResponse.json({ error: "Range too large (max 50,000)" }, { status: 400 });
    }

    for (let num = startNumber; num <= endNumber; num++) {
      const studentId = formatStudentId(yearEnrolled, num);
      const existing = await db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
      if (existing.length > 0) {
        skipped.push(studentId);
        continue;
      }
      const password = randomPassword(8);
      const passwordHash = await hash(password, 10);
      const [inserted] = await db
        .insert(users)
        .values({
          studentId,
          passwordHash,
          role: "voter",
        })
        .returning({ id: users.id });
      if (inserted) {
        await db.insert(userGroups).values({ userId: inserted.id, groupId });
        await logAudit({
          action: "voter.create",
          entityType: "user",
          entityId: studentId,
          userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
          payload: { studentId, source: "bulk_range", groupId },
        });
        created.push(studentId);
      }
    }

    return NextResponse.json({
      data: {
        created: created.length,
        skipped: skipped.length,
        createdIds: created,
        skippedIds: skipped,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create voters" }, { status: 500 });
  }
}
