-- AlterTable
ALTER TABLE "seeker_profiles" ADD COLUMN     "current_ctc_currency" TEXT DEFAULT 'INR',
ADD COLUMN     "expected_ctc_currency" TEXT DEFAULT 'INR';
