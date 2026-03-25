DO $$
BEGIN
  -- Fresh database path (e.g. shadow DB): create the table directly.
  IF to_regclass('"Reflection"') IS NULL THEN
    CREATE TABLE "Reflection" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "template_type" TEXT,
      "impact" TEXT NOT NULL DEFAULT 'minor',
      "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "fields" JSONB,
      "content" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "projectId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
    );

    ALTER TABLE "Reflection"
      ADD CONSTRAINT "Reflection_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "Reflection"
      ADD CONSTRAINT "Reflection_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ELSE
    -- Legacy database path: migrate existing Reflection schema in-place.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'type'
    ) THEN
      ALTER TABLE "Reflection" RENAME COLUMN "type" TO "category";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'template_type'
    ) THEN
      ALTER TABLE "Reflection" ADD COLUMN "template_type" TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'fields'
    ) THEN
      ALTER TABLE "Reflection" ADD COLUMN "fields" JSONB;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'tags'
    ) THEN
      ALTER TABLE "Reflection" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'userId'
    ) THEN
      ALTER TABLE "Reflection" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Reflection'
        AND column_name = 'content'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE "Reflection" ALTER COLUMN "content" DROP NOT NULL;
    END IF;

    -- Backfill author from owning project for legacy rows before enforcing FK.
    UPDATE "Reflection" r
    SET "userId" = p."userId"
    FROM "Project" p
    WHERE r."projectId" = p."id"
      AND (r."userId" IS NULL OR r."userId" = '');

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'Reflection_userId_fkey'
    ) THEN
      ALTER TABLE "Reflection"
        ADD CONSTRAINT "Reflection_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
