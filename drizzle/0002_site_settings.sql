CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "school_name" varchar(255) DEFAULT 'School Election' NOT NULL,
  "logo_url" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "site_settings" ("id", "school_name", "logo_url", "updated_at")
VALUES (1, 'School Election', NULL, now())
ON CONFLICT ("id") DO NOTHING;
