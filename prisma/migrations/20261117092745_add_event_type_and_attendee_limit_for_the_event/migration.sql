-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "attendeeLimit" INTEGER,
ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'FREE';
