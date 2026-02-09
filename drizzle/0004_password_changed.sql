-- Add password_changed flag to users table

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed" integer DEFAULT 0 NOT NULL;
