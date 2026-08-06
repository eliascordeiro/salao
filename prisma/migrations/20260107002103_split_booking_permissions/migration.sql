-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "canCancelBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canConfirmBooking" BOOLEAN NOT NULL DEFAULT false;
