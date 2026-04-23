/*
  Warnings:

  - A unique constraint covering the columns `[clerk_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "employer_profiles_company_name_trgm_idx";

-- DropIndex
DROP INDEX "jobs_location_trgm_idx";

-- DropIndex
DROP INDEX "jobs_title_trgm_idx";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "category" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "job_type" TEXT,
ADD COLUMN     "nice_to_have" TEXT,
ADD COLUMN     "qualifications" TEXT,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "seniority" TEXT,
ADD COLUMN     "undisclosed_salary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clerk_id" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");
