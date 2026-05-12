/*
  Warnings:

  - You are about to drop the column `current_ctc_currency` on the `seeker_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `expected_ctc_currency` on the `seeker_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seeker_profiles" DROP COLUMN "current_ctc_currency",
DROP COLUMN "expected_ctc_currency",
ADD COLUMN     "ctc_currency" TEXT DEFAULT 'INR';
