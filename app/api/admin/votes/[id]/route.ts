import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { votes } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/db/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Votes cannot be deleted to maintain election integrity
  return NextResponse.json({ error: "Votes cannot be deleted. This ensures election integrity and prevents tampering." }, { status: 403 });
}
