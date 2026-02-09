import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parties } from "@/lib/db";
import { eq } from "drizzle-orm";
import { partyBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    const list = electionId
      ? await db.select().from(parties).where(eq(parties.electionId, parseInt(electionId, 10))).orderBy(parties.id)
      : await db.select().from(parties).orderBy(parties.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch parties" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = partyBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [inserted] = await db
      .insert(parties)
      .values({
        electionId: parsed.data.electionId ?? null,
        name: parsed.data.name,
        color: parsed.data.color ?? null,
      })
      .returning();
    await logAudit({
      action: "party.create",
      entityType: "party",
      entityId: String(inserted?.id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: inserted?.name },
    });
    return NextResponse.json({ data: inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create party" }, { status: 500 });
  }
}
