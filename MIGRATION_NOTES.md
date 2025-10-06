# Migration Notes for Task H

## Required Migration

The schema has been updated with the `rubric` field. You need to run the migration manually:

```bash
npx prisma migrate dev --name grading_rubric
```

**When prompted with "Are you sure you want to create and apply this migration?"**, type `y` and press Enter.

## What the Migration Does

Adds a single field to the `attempt_sections` table:
- `rubric` (JSONB) - Optional field for storing grading rubric data

## If Migration Fails

If you see EPERM errors (Windows file lock):
1. Stop your dev server (Ctrl+C)
2. Run the migration again
3. Restart your dev server

## After Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Verification

Check that the field was added:

```sql
-- In your PostgreSQL console
\d attempt_sections

-- Should show:
-- rubric | jsonb | | |
```

## If You Need to Reset (Development Only)

⚠️ **WARNING: This will delete all data!**

```bash
npx prisma migrate reset
npx prisma migrate dev
```

---

That's it! Once the migration runs successfully, all Task H features will be fully functional.

