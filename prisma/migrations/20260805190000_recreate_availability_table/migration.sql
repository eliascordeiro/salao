-- Recreate Availability table after previous removal migration.
-- This migration is intentionally idempotent for safer deploys across environments.

CREATE TABLE IF NOT EXISTS "Availability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'BLOCK',
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,
    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Availability_dayOfWeek_idx" ON "Availability"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "Availability_staffId_idx" ON "Availability"("staffId");
CREATE INDEX IF NOT EXISTS "Availability_date_idx" ON "Availability"("date");
CREATE INDEX IF NOT EXISTS "Availability_staffId_dayOfWeek_idx" ON "Availability"("staffId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "Availability_staffId_date_idx" ON "Availability"("staffId", "date");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Availability_staffId_fkey'
    ) THEN
        ALTER TABLE "Availability"
        ADD CONSTRAINT "Availability_staffId_fkey"
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
