import dotenv from "dotenv";
import path from "path";
import { hash } from "bcryptjs";

// Load .env.local BEFORE any module that reads process.env.DATABASE_URL (imports are hoisted, so we must load env first)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function seed() {
  // Dynamic import so db is created after DATABASE_URL is set
  const { db, elections, positions, parties, candidates, users } = await import("./index");
  const { eq, and } = await import("drizzle-orm");

  // Use existing election if already seeded (idempotent)
  const existing = await db
    .select()
    .from(elections)
    .where(
      and(
        eq(elections.name, "2024-2025 Student Government"),
        eq(elections.academicYear, "2024-2025")
      )
    )
    .limit(1);

  let election = existing[0];

  if (!election) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const [inserted] = await db
      .insert(elections)
      .values({
        name: "2024-2025 Student Government",
        academicYear: "2024-2025",
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 7 * 86400000),
        isActive: 1,
        code,
      })
      .returning();
    if (!inserted) throw new Error("Failed to create election");
    election = inserted;

    const [presidentPos, vpPos] = await db
      .insert(positions)
      .values([
        { electionId: election.id, name: "President", description: "Student Body President", seatsCount: 1, orderIndex: 0 },
        { electionId: election.id, name: "Vice President", description: "VP", seatsCount: 1, orderIndex: 1 },
      ])
      .returning();

    const [partyA, partyB] = await db
      .insert(parties)
      .values([
        { electionId: election.id, name: "Student Party", color: "#136dec" },
        { electionId: election.id, name: "Green Party", color: "#22c55e" },
      ])
      .returning();

    await db.insert(candidates).values([
      { positionId: presidentPos!.id, partyId: partyA!.id, name: "Alex Rivera", grade: "11th Grade", bio: "Committed to sustainability." },
      { positionId: presidentPos!.id, partyId: partyB!.id, name: "Jordan Smith", grade: "12th Grade", bio: "A voice for all students." },
      { positionId: presidentPos!.id, partyId: null, name: "Casey Wong", grade: "11th Grade", bio: "Independent candidate." },
      { positionId: vpPos!.id, partyId: partyA!.id, name: "Taylor Morgan", grade: "11th Grade", bio: "VP candidate." },
      { positionId: vpPos!.id, partyId: null, name: "Riley Davis", grade: "12th Grade", bio: "Independent." },
    ]);
  }

  // Insert default users; skip if already exist (idempotent)
  const adminHash = await hash("admin123", 10);
  const voterHash = await hash("voter123", 10);
  await db
    .insert(users)
    .values([
      { studentId: "admin1", passwordHash: adminHash, role: "admin", name: "Admin User" },
      { studentId: "10001", passwordHash: voterHash, role: "voter", name: "Student Voter" },
    ])
    .onConflictDoNothing({ target: users.studentId });

  console.log("Seed complete: election, positions, parties, candidates, admin (admin1/admin123), voter (10001/voter123)");
}

seed().catch(console.error).finally(() => process.exit(0));
