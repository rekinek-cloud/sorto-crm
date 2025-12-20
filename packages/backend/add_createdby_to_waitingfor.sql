-- DropForeignKey
ALTER TABLE "waiting_for" DROP CONSTRAINT "waiting_for_createdById_fkey";

-- AlterTable
ALTER TABLE "waiting_for" DROP COLUMN "createdById";

