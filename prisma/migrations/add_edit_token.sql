-- Add self-service edit token fields to Tag
-- Idempotent: safe to run multiple times

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tag' AND column_name = 'editToken') THEN
    ALTER TABLE "Tag" ADD COLUMN "editToken" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tag' AND column_name = 'editTokenExp') THEN
    ALTER TABLE "Tag" ADD COLUMN "editTokenExp" TIMESTAMP(3);
  END IF;
END $$;
