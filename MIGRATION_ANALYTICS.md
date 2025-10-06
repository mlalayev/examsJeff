# Migration Instructions for Task J (Analytics)

## Required Migration

The schema has been updated with the `QuestionTag` model. You need to run the migration:

```bash
# 1. Stop your dev server (Ctrl+C)

# 2. Run the migration
npx prisma migrate dev --name analytics_tags

# When prompted "Are you sure you want to create and apply this migration?"
# Type: y
# Press: Enter

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Restart your dev server
npm run dev
```

## What This Migration Does

**Creates `question_tags` table:**
- `id` (String, Primary Key)
- `questionId` (String, Foreign Key → questions.id)
- `tag` (String)
- `createdAt` (DateTime)

**Creates Indexes:**
- Index on `tag` (for fast filtering)
- Index on `questionId` (for question lookups)

**Adds Relation:**
- `Question.tags` → `QuestionTag[]`

## After Migration

1. **Verify Schema:**
   ```bash
   npx prisma studio
   ```
   - Check that `question_tags` table exists
   - Verify indexes are present

2. **Test API:**
   ```bash
   # In browser console (as TEACHER)
   fetch('/api/analytics/teacher/overview?classId=YOUR_CLASS_ID')
     .then(r => r.json())
     .then(console.log);
   ```

3. **Access Analytics Page:**
   - Navigate to `/dashboard/teacher/classes`
   - Click "Analytics" button on a class card
   - Should load analytics page successfully

## If Migration Fails

### EPERM Error (Windows)
```
Error: EPERM: operation not permitted, rename...
```

**Solution:**
1. Stop dev server completely
2. Close VSCode/editor if it's running TypeScript server
3. Run migration again
4. Restart dev server

### Data Loss Warning
If you see a warning about data loss, it's because:
- Adding indexes shouldn't cause data loss
- This is a safe migration

Type `y` to confirm.

## Database Verification

After migration, verify in PostgreSQL:

```sql
-- Check table exists
\d question_tags

-- Should show:
-- Column      | Type      | Collation | Nullable | Default
-- id          | text      |           | not null | 
-- questionId  | text      |           | not null | 
-- tag         | text      |           | not null | 
-- createdAt   | timestamp |           | not null | now()

-- Check indexes
\di question_tags*

-- Should show:
-- question_tags_pkey (PRIMARY KEY)
-- question_tags_tag_idx
-- question_tags_questionId_idx
```

## Seed Question Tags

After migration, add tags to questions for analytics to work:

```sql
-- Example: Tag True/False/Not Given questions
INSERT INTO question_tags (id, "questionId", tag, "createdAt")
SELECT 
  'tag_' || id || '_tfng',
  id,
  'True/False/Not Given',
  NOW()
FROM questions
WHERE qtype = 'true_false_not_given';

-- Example: Tag Matching questions
INSERT INTO question_tags (id, "questionId", tag, "createdAt")
SELECT 
  'tag_' || id || '_match',
  id,
  'Matching Headings',
  NOW()
FROM questions
WHERE qtype = 'matching';

-- Example: Tag Fill in Blanks
INSERT INTO question_tags (id, "questionId", tag, "createdAt")
SELECT 
  'tag_' || id || '_fib',
  id,
  'Fill in Blanks',
  NOW()
FROM questions
WHERE qtype = 'fill_in_blank';

-- Example: Tag Multiple Choice
INSERT INTO question_tags (id, "questionId", tag, "createdAt")
SELECT 
  'tag_' || id || '_mc',
  id,
  'Multiple Choice',
  NOW()
FROM questions
WHERE qtype = 'multiple_choice';
```

Or use the seed script in `TESTING_ANALYTICS.md`.

## Rollback (If Needed)

⚠️ **Only do this if absolutely necessary:**

```bash
npx prisma migrate reset
```

**WARNING:** This will:
- Delete ALL data
- Rerun all migrations from scratch
- Require re-seeding all data

Better option: Create a new migration to undo changes:

```bash
npx prisma migrate dev --name remove_question_tags
```

Then manually edit the migration file to drop the table.

---

## Quick Checklist

After running migration:

- [ ] Migration completed successfully
- [ ] Prisma Client regenerated
- [ ] Dev server restarted
- [ ] `question_tags` table exists in DB
- [ ] Indexes created
- [ ] Analytics API endpoint works
- [ ] Analytics page loads
- [ ] No console errors

If all checkboxes are checked, you're good to go! ✅

---

**Migration for Task J complete!** 🎉

The analytics system is now ready to track weak topics and provide data-driven insights.

