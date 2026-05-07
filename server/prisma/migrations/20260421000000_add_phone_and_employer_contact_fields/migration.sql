-- AlterTable: Add phone to seeker_profiles
ALTER TABLE "seeker_profiles" ADD COLUMN "phone" TEXT;

-- AlterTable: Add contact/company fields to employer_profiles
ALTER TABLE "employer_profiles"
  ADD COLUMN "phone"              TEXT,
  ADD COLUMN "contact_phone_code" TEXT,
  ADD COLUMN "contact_name"       TEXT,
  ADD COLUMN "contact_email"      TEXT,
  ADD COLUMN "address"            TEXT,
  ADD COLUMN "city"               TEXT,
  ADD COLUMN "state"              TEXT,
  ADD COLUMN "country"            TEXT,
  ADD COLUMN "country_code"       TEXT,
  ADD COLUMN "tagline"            TEXT,
  ADD COLUMN "founded_year"       TEXT,
  ADD COLUMN "linked_in_url"      TEXT,
  ADD COLUMN "twitter_url"        TEXT;
