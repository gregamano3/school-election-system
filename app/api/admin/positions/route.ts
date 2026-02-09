import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { positions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { positionBodySchema } from "@/lib/validations";
import { logAudit } from "@/lib/db/audit";
import { sanitizeText, sanitizeMultilineText } from "@/lib/sanitize";
import { sanitizeError } from "@/lib/error-utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");
    if (!electionId) {
      return NextResponse.json({ error: "electionId required" }, { status: 400 });
    }
    const list = await db
      .select()
      .from(positions)
      .where(eq(positions.electionId, parseInt(electionId, 10)))
      .orderBy(positions.orderIndex, positions.id);
    return NextResponse.json({ data: list });
  } catch (e) {
    const { message } = sanitizeError(e, "fetch-positions");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = positionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const [inserted] = await db
      .insert(positions)
      .values({
        electionId: parsed.data.electionId,
        name: sanitizeText(parsed.data.name),
        description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
        seatsCount: parsed.data.seatsCount,
        gradeEligibility: parsed.data.gradeEligibility ?? [],
        orderIndex: parsed.data.orderIndex,
      })
      .returning();
    await logAudit({
      action: "position.create",
      entityType: "position",
      entityId: String(inserted?.id),
      userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
      payload: { name: inserted?.name },
    });
    return NextResponse.json({ data: inserted });
  } catch (e) {
    const { message } = sanitizeError(e, "create-position");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
