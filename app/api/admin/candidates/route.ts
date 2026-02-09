import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { candidates, parties } from "@/lib/db";
import { eq } from "drizzle-orm";
import { candidateBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get("positionId");
    if (!positionId) {
      return NextResponse.json({ error: "positionId required" }, { status: 400 });
    }
    const list = await db
      .select({
        id: candidates.id,
        positionId: candidates.positionId,
        partyId: candidates.partyId,
        name: candidates.name,
        grade: candidates.grade,
        bio: candidates.bio,
        imageUrl: candidates.imageUrl,
        createdAt: candidates.createdAt,
        partyName: parties.name,
        partyColor: parties.color,
      })
      .from(candidates)
      .leftJoin(parties, eq(candidates.partyId, parties.id))
      .where(eq(candidates.positionId, parseInt(positionId, 10)))
      .orderBy(candidates.id);
    const data = list.map((r) => ({
      ...r,
      party: r.partyName ? { name: r.partyName, color: r.partyColor } : null,
      partyName: undefined,
      partyColor: undefined,
    }));
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = candidateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [inserted] = await db
      .insert(candidates)
      .values({
        positionId: parsed.data.positionId,
        partyId: parsed.data.partyId ?? null,
        name: parsed.data.name,
        grade: parsed.data.grade ?? null,
        bio: parsed.data.bio ?? null,
        imageUrl: parsed.data.imageUrl && parsed.data.imageUrl !== "" ? parsed.data.imageUrl : null,
      })
      .returning();
    await logAudit({
      action: "candidate.create",
      entityType: "candidate",
      entityId: String(inserted?.id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: inserted?.name },
    });
    return NextResponse.json({ data: inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
