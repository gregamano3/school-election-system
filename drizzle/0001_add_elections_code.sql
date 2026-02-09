-- Add "code" column to elections if missing (for DBs created before code was added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'elections' AND column_name = 'code'
  ) THEN
    ALTER TABLE elections ADD COLUMN code varchar(8);
    UPDATE elections SET code = (100000 + id)::text WHERE code IS NULL;
    ALTER TABLE elections ALTER COLUMN code SET NOT NULL;
    ALTER TABLE elections ADD CONSTRAINT elections_code_unique UNIQUE (code);
  END IF;
END $$;
