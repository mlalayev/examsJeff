# Database Migration Required

## What Changed
Changed the `instruction` field in the `ExamSection` model from `String?` to `Json?` to support rich instruction data with text, audio, passage, and introduction fields.

## How to Apply

### Option 1: Development Database (Recommended for Testing)
Run this command in your terminal:
```bash
npx prisma migrate dev --name change-instruction-to-json
```

This will:
1. Create a new migration file
2. Apply it to your database
3. Update the Prisma client

### Option 2: Production Database
When ready for production, run:
```bash
npx prisma migrate deploy
```

## What This Does

**Before:**
```prisma
instruction     String?
```

**After:**
```prisma
instruction     Json?
```

## Data Migration

The database will automatically convert existing string values to JSON. However, you may need to ensure existing data is properly formatted.

### If You Have Existing Data

You may need to run this SQL to convert existing string instructions to JSON format:

```sql
-- For PostgreSQL
UPDATE exam_sections 
SET instruction = jsonb_build_object('text', instruction)
WHERE instruction IS NOT NULL 
  AND instruction NOT LIKE '{%';

-- For MySQL/MariaDB
UPDATE exam_sections 
SET instruction = JSON_OBJECT('text', instruction)
WHERE instruction IS NOT NULL 
  AND instruction NOT LIKE '{%';
```

This converts existing text like:
```
"This is the instruction"
```

To JSON like:
```json
{"text": "This is the instruction"}
```

## Rollback (If Needed)

If something goes wrong, you can rollback:
```bash
npx prisma migrate resolve --rolled-back [migration-name]
```

## Verification

After migration, verify the data:

```sql
-- Check instruction format
SELECT id, title, instruction 
FROM exam_sections 
LIMIT 5;
```

Expected format:
```json
{
  "text": "Main instruction text",
  "audio": "/api/audio/file.mp3",
  "passage": "Optional passage text",
  "introduction": "Optional introduction"
}
```

## Notes

- ✅ Existing string values will be preserved
- ✅ New questions can save objects
- ✅ Backward compatible (can still read old string values)
- ⚠️ Make a backup before running migration on production
- ⚠️ Test thoroughly in development first

## After Migration

1. Test creating new questions with Quick Edit
2. Verify existing questions still work
3. Check that instructions display correctly
4. Test on both IELTS and SAT exams
