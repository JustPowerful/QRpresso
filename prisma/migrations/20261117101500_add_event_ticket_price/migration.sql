-- Add event-level pricing. Existing events remain free of charge until configured.
ALTER TABLE "Event"
ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
