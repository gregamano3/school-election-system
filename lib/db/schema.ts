import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  academicYear: varchar("academic_year", { length: 32 }).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  isActive: integer("is_active").default(1).notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  seatsCount: integer("seats_count").default(1).notNull(),
  gradeEligibility: jsonb("grade_eligibility").$type<string[]>().default([]),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").references(() => elections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  partyId: integer("party_id").references(() => parties.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 32 }),
  bio: text("bio"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  studentId: varchar("student_id", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("voter"),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    electionId: integer("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
    positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
    candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("votes_user_position_election").on(table.userId, table.positionId, table.electionId),
  ]
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  userId: integer("user_id").references(() => users.id),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull().default("School Election"),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
