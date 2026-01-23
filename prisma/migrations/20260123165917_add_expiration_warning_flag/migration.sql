-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "expiration_warning_sent" BOOLEAN NOT NULL DEFAULT false;
