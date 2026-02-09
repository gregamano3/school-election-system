import {
  mysqlTable,
  serial,
  text,
  varchar,
  datetime,
  int,
  uniqueIndex,
  json,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const elections = mysqlTable("elections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  academicYear: varchar("academic_year", { length: 32 }).notNull(),
  startDate: datetime("start_date", { fsp: 3 }).notNull(),
  endDate: datetime("end_date", { fsp: 3 }).notNull(),
  isActive: int("is_active").default(1).notNull(),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const positions = mysqlTable("positions", {
  id: serial("id").primaryKey(),
  electionId: int("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  seatsCount: int("seats_count").default(1).notNull(),
  gradeEligibility: json("grade_eligibility").$type<string[]>().default([]),
  orderIndex: int("order_index").default(0).notNull(),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const parties = mysqlTable("parties", {
  id: serial("id").primaryKey(),
  electionId: int("election_id").references(() => elections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const candidates = mysqlTable("candidates", {
  id: serial("id").primaryKey(),
  positionId: int("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  partyId: int("party_id").references(() => parties.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 32 }),
  bio: text("bio"),
  imageUrl: text("image_url"),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  studentId: varchar("student_id", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("voter"),
  name: varchar("name", { length: 255 }),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const votes = mysqlTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    electionId: int("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
    positionId: int("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
    candidateId: int("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
  },
  (table) => [
    uniqueIndex("votes_user_position_election").on(table.userId, table.positionId, table.electionId),
  ]
);

export const auditLog = mysqlTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  userId: int("user_id").references(() => users.id),
  payload: json("payload").$type<Record<string, unknown>>(),
  createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export const siteSettings = mysqlTable("site_settings", {
  id: serial("id").primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull().default("School Election"),
  logoUrl: text("logo_url"),
  updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
});

export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
export type Party = typeof parties.$inferSelect;
export type NewParty = typeof parties.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;
