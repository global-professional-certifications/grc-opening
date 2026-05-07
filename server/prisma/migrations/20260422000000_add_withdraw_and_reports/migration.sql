-- Add WITHDRAWN value to ApplicationStatus enum
-- Note: ADD VALUE cannot run inside a transaction in PostgreSQL < 12.
-- Prisma wraps migrations in transactions, so this step runs first via DO block.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'WITHDRAWN'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApplicationStatus')
  ) THEN
    ALTER TYPE "ApplicationStatus" ADD VALUE 'WITHDRAWN';
  END IF;
END $$;

-- Add ReportReason enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportReason') THEN
    CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'MISLEADING', 'INAPPROPRIATE', 'OTHER');
  END IF;
END $$;

-- Drop old index and add unique constraint on applications (idempotent)
DROP INDEX IF EXISTS "applications_seeker_id_job_id_idx";
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_seeker_id_job_id_key";
ALTER TABLE "applications" ADD CONSTRAINT "applications_seeker_id_job_id_key" UNIQUE ("seeker_id", "job_id");

-- Create job_reports table (idempotent)
CREATE TABLE IF NOT EXISTS "job_reports" (
    "id"          TEXT NOT NULL,
    "job_id"      TEXT NOT NULL,
    "seeker_id"   TEXT NOT NULL,
    "reason"      "ReportReason" NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_reports_pkey" PRIMARY KEY ("id")
);

-- FK: job_reports -> jobs (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'job_reports_job_id_fkey'
  ) THEN
    ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_job_id_fkey"
      FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: job_reports -> seeker_profiles (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'job_reports_seeker_id_fkey'
  ) THEN
    ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_seeker_id_fkey"
      FOREIGN KEY ("seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
