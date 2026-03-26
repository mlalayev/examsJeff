-- AlterTable: Split name field into firstName and lastName while preserving data

-- Step 1: Add new columns
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

-- Step 2: Migrate existing data
-- Split existing "name" values into firstName and lastName
-- If name has a space, split it; otherwise, put everything in firstName
UPDATE "users" 
SET 
  "firstName" = CASE 
    WHEN "name" IS NULL THEN NULL
    WHEN POSITION(' ' IN "name") > 0 THEN SPLIT_PART("name", ' ', 1)
    ELSE "name"
  END,
  "lastName" = CASE 
    WHEN "name" IS NULL THEN NULL
    WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE NULL
  END
WHERE "name" IS NOT NULL;

-- Step 3: Drop the old name column
ALTER TABLE "users" DROP COLUMN "name";
