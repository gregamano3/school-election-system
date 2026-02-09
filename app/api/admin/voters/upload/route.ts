import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { logAudit } from "@/lib/db/audit";

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const studentIdIdx = header.indexOf("student_id");
    const passwordIdx = header.indexOf("password");
    const nameIdx = header.indexOf("name");
    const roleIdx = header.indexOf("role");

    if (studentIdIdx === -1 || passwordIdx === -1) {
      return NextResponse.json(
        { error: "CSV must have columns: student_id, password. Optional: name, role" },
        { status: 400 }
      );
    }

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const studentId = (values[studentIdIdx] ?? "").trim();
      const password = (values[passwordIdx] ?? "").trim();
      const name = (nameIdx >= 0 ? values[nameIdx] ?? "" : "").trim() || null;
      const roleRaw = (roleIdx >= 0 ? values[roleIdx] ?? "" : "").trim().toLowerCase();
      const role = roleRaw === "admin" ? "admin" : "voter";

      if (!studentId || !password) {
        errors.push(`Row ${i + 1}: student_id and password are required`);
        continue;
      }
      if (password.length < 6) {
        errors.push(`Row ${i + 1}: password must be at least 6 characters`);
        continue;
      }
      if (studentId.length > 64) {
        errors.push(`Row ${i + 1}: student_id too long`);
        continue;
      }

      const existing = await db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
      if (existing.length > 0) {
        skipped.push(studentId);
        continue;
      }

      const passwordHash = await hash(password, 10);
      await db.insert(users).values({
        studentId,
        name,
        passwordHash,
        role,
      });
      await logAudit({
        action: "voter.create",
        entityType: "user",
        entityId: studentId,
        userId: session?.user?.id ? parseInt(session.user.id, 10) : undefined,
        payload: { studentId, source: "csv_upload" },
      });
      created.push(studentId);
    }

    return NextResponse.json({
      data: {
        created: created.length,
        skipped: skipped.length,
        errors: errors.length,
        createdIds: created,
        skippedIds: skipped,
        errorMessages: errors,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}
