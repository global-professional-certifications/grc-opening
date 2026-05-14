-- AlterTable
ALTER TABLE "seeker_profiles" ADD COLUMN     "buyback_option" TEXT,
ADD COLUMN     "current_ctc" TEXT,
ADD COLUMN     "expected_ctc" TEXT,
ADD COLUMN     "notice_period" TEXT,
ADD COLUMN     "open_to_share_critical_info" BOOLEAN NOT NULL DEFAULT false;
