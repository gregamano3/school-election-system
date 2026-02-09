import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { elections } from "@/lib/db";
import { eq } from "drizzle-orm";
import { electionBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

function generateElectionCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function ensureUniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateElectionCode();
    const [existing] = await db.select().from(elections).where(eq(elections.code, code)).limit(1);
    if (!existing) return code;
  }
  return generateElectionCode() + String(Date.now()).slice(-2);
}

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const list = await db.select().from(elections).orderBy(elections.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = electionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const code = await ensureUniqueCode();
    const [inserted] = await db
      .insert(elections)
      .values({
        name: parsed.data.name,
        academicYear: parsed.data.academicYear,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        isActive: parsed.data.isActive,
        code,
      })
      .returning();
    await logAudit({
      action: "election.create",
      entityType: "election",
      entityId: String(inserted?.id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: inserted?.name },
    });
    return NextResponse.json({ data: inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create election" }, { status: 500 });
  }
}
