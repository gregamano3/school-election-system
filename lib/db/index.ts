import postgres from "postgres";
import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js";
import * as pgSchema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/school_election";
const isMySQL = connectionString.startsWith("mysql");

function getSchema() {
  if (isMySQL) {
    return require("./schema-mysql") as typeof pgSchema;
  }
  return pgSchema;
}

const schema = getSchema();

// Reuse a single client in dev to avoid "too many clients" from hot reload creating new pools.
const globalForDb = globalThis as unknown as {
  _postgresClient: ReturnType<typeof postgres> | undefined;
  _mysqlDrizzle: ReturnType<typeof pgDrizzle> | undefined;
};

let dbInstance: ReturnType<typeof pgDrizzle>;
if (isMySQL) {
  if (process.env.NODE_ENV !== "production" && globalForDb._mysqlDrizzle) {
    dbInstance = globalForDb._mysqlDrizzle;
  } else {
    const mysql = require("mysql2/promise");
    const { drizzle: mysqlDrizzle } = require("drizzle-orm/mysql2");
    const pool = mysql.createPool(connectionString, { waitForConnections: true, connectionLimit: 10 });
    dbInstance = mysqlDrizzle(pool, { schema }) as ReturnType<typeof pgDrizzle>;
    if (process.env.NODE_ENV !== "production") globalForDb._mysqlDrizzle = dbInstance;
  }
} else {
  if (process.env.NODE_ENV !== "production" && globalForDb._postgresClient) {
    dbInstance = pgDrizzle(globalForDb._postgresClient, { schema });
  } else {
    const client = postgres(connectionString, { max: 10 });
    if (process.env.NODE_ENV !== "production") globalForDb._postgresClient = client;
    dbInstance = pgDrizzle(client, { schema });
  }
}

export const db = dbInstance;
export const elections = schema.elections;
export const positions = schema.positions;
export const parties = schema.parties;
export const candidates = schema.candidates;
export const users = schema.users;
export const votes = schema.votes;
export const auditLog = schema.auditLog;
export const siteSettings = schema.siteSettings;

export type Election = pgSchema.Election;
export type NewElection = pgSchema.NewElection;
export type Position = pgSchema.Position;
export type NewPosition = pgSchema.NewPosition;
export type Party = pgSchema.Party;
export type NewParty = pgSchema.NewParty;
export type Candidate = pgSchema.Candidate;
export type NewCandidate = pgSchema.NewCandidate;
export type User = pgSchema.User;
export type NewUser = pgSchema.NewUser;
export type Vote = pgSchema.Vote;
export type NewVote = pgSchema.NewVote;
export type AuditLogEntry = pgSchema.AuditLogEntry;
export type NewAuditLogEntry = pgSchema.NewAuditLogEntry;
export type SiteSettings = pgSchema.SiteSettings;
export type NewSiteSettings = pgSchema.NewSiteSettings;
