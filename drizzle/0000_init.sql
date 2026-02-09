CREATE TABLE IF NOT EXISTS "elections" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "academic_year" varchar(32) NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "is_active" integer DEFAULT 1 NOT NULL,
  "code" varchar(8) NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "positions" (
  "id" serial PRIMARY KEY NOT NULL,
  "election_id" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "seats_count" integer DEFAULT 1 NOT NULL,
  "grade_eligibility" jsonb DEFAULT '[]',
  "order_index" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "parties" (
  "id" serial PRIMARY KEY NOT NULL,
  "election_id" integer,
  "name" varchar(255) NOT NULL,
  "color" varchar(32),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "candidates" (
  "id" serial PRIMARY KEY NOT NULL,
  "position_id" integer NOT NULL,
  "party_id" integer,
  "name" varchar(255) NOT NULL,
  "grade" varchar(32),
  "bio" text,
  "image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255),
  "student_id" varchar(64) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "role" varchar(16) DEFAULT 'voter' NOT NULL,
  "name" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "votes" (
  "id" serial PRIMARY KEY NOT NULL,
  "election_id" integer NOT NULL,
  "position_id" integer NOT NULL,
  "candidate_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "action" varchar(64) NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" varchar(64),
  "user_id" integer,
  "payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add constraints only if they do not exist (idempotent)
DO $$ BEGIN
  ALTER TABLE "positions" ADD CONSTRAINT "positions_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "parties" ADD CONSTRAINT "parties_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "votes" ADD CONSTRAINT "votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "votes" ADD CONSTRAINT "votes_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "votes_user_position_election" ON "votes" ("user_id","position_id","election_id");
