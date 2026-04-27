-- Add UserStatus enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
  END IF;
END $$;

-- Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Add is_verified column to employer_profiles table
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
