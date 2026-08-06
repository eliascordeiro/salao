/*
  Warnings:

  - Changed the type of `features` on the `Plan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- Step 1: Add new columns
ALTER TABLE "Plan" ADD COLUMN "featuresList" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Plan" ADD COLUMN "features_new" JSONB;

-- Step 2: Copy existing data to featuresList for backup
UPDATE "Plan" SET "featuresList" = "features";

-- Step 3: Create default JSON features based on plan slug
UPDATE "Plan" SET "features_new" = 
  CASE 
    WHEN "slug" = 'essencial' THEN '{"email": true, "basicReports": true, "geolocation": true, "maxStaff": 2}'::jsonb
    WHEN "slug" = 'profissional' THEN '{"email": true, "whatsapp": true, "basicReports": true, "advancedReports": true, "geolocation": true, "maps": true, "multiUser": true, "aiChat": true, "prioritySupport": true}'::jsonb
    ELSE '{"email": true}'::jsonb
  END;

-- Step 4: Drop old column and rename new one
ALTER TABLE "Plan" DROP COLUMN "features";
ALTER TABLE "Plan" RENAME COLUMN "features_new" TO "features";

-- Step 5: Make features NOT NULL
ALTER TABLE "Plan" ALTER COLUMN "features" SET NOT NULL;
