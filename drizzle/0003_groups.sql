-- Voter groups and election eligibility

CREATE TABLE IF NOT EXISTS "groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_groups" (
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "group_id" integer NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  UNIQUE("user_id", "group_id")
);

CREATE TABLE IF NOT EXISTS "election_allowed_groups" (
  "election_id" integer NOT NULL REFERENCES "elections"("id") ON DELETE CASCADE,
  "group_id" integer NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  UNIQUE("election_id", "group_id")
);

