-- Add deadline field for job postings
ALTER TABLE "jobs"
ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);

-- Fast filtering for discover endpoint (status + deadline)
CREATE INDEX IF NOT EXISTS "jobs_status_deadline_idx"
ON "jobs" ("status", "deadline");

-- Fast text search indexes (trigram). Helps ILIKE/contains queries.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "jobs_title_trgm_idx"
ON "jobs"
USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "jobs_location_trgm_idx"
ON "jobs"
USING GIN ("location" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "employer_profiles_company_name_trgm_idx"
ON "employer_profiles"
USING GIN ("company_name" gin_trgm_ops);

