# Bug Fixes Deployment - 2026-03-29

## Issues Fixed

### 1. ✅ IELTS Speaking - Next Button Enhancement
**Problem**: İstifadəçi cavabını bitirdikdən sonra timer bitənə qədər gözləməli idi.

**Solution**: Bu artıq həll olunmuşdur (user təsdiqləyib).

### 2. ✅ Exam Edit - 500 Internal Server Error (FIXED)
**Problem**: Edit düyməsinə basanda `GET /api/admin/exams/{id}` 500 error verir.

**Root Cause**: 
```
Unknown field `name` for select statement on model `User`
```

API route User model-dən `name` field-ini seçməyə çalışırdı, amma User schema-da `name` field yoxdur. Əvəzinə `firstName` və `lastName` var.

**Solution**: 
- `name` → `firstName` və `lastName` ilə əvəz edildi
- GET və PATCH metodlarında düzəldildi
- Enhanced error logging əlavə edildi

**Files Changed**:
1. `src/app/api/admin/exams/[id]/route.ts` - Fixed User field names and added logging
2. `src/app/dashboard/admin/exams/[id]/edit/page.tsx` - Enhanced client error handling

### 3. ✅ Microphone Permission Policy Fix
**Status**: Əvvəlki deployment-də həll edildi.

## Deployment Instructions

### Step 1: Commit and Push Changes
```bash
git add -A
git commit -m "Fix exam edit error logging and improve error messages"
git push origin main
```

### Step 2: Deploy to Production Server
```bash
# Connect to server
ssh root@exams.jeff.az

# Navigate to project
cd /root/examsJeff

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm ci

# Build application
npm run build

# Restart PM2
pm2 restart examsJeff
pm2 save
```

### Step 3: Check Logs for Errors
```bash
# On server
pm2 logs examsJeff --lines 100

# Or tail live logs
pm2 logs examsJeff
```

## Testing After Deployment

### Test Exam Edit Error

1. Go to: https://exams.jeff.az/dashboard/admin/exams
2. Click "Edit" button on any exam
3. Check browser console (F12) for detailed logs:
   - "Fetching exam: [examId]"
   - "Fetch response status: [status]"
   - If error: Detailed error message with status code

4. Check server logs:
```bash
ssh root@exams.jeff.az
pm2 logs examsJeff --lines 50 | grep "\[API\]"
```

Expected logs:
```
[API] GET /api/admin/exams/cmnbe9vcq000dl1mfp2yugh99
[API] Fetching exam from database: cmnbe9vcq000dl1mfp2yugh99
[API] Exam loaded successfully: [Exam Title]
```

If error:
```
[API] Admin get exam error: [Error details]
[API] Error details: { message: "...", stack: "...", examId: "..." }
```

## Expected Outcomes

### If Database Connection Issue:
```
Error: Can't reach database server
```
**Fix**: Check database connection in `.env` file

### If Exam Not Found:
```
Status 404: Exam not found
```
**Fix**: Exam ID might be invalid or deleted

### If Auth Issue:
```
Status 403: Admin access required
```
**Fix**: Check user session and admin role

### If Data Format Issue:
```
Status 500: Prisma validation error / JSON parse error
```
**Fix**: Check database schema and data integrity

## Rollback Plan

If deployment causes issues:

```bash
ssh root@exams.jeff.az
cd /root/examsJeff

# View recent commits
git log --oneline -n 5

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
npm run build
pm2 restart examsJeff
```

## Additional Monitoring

### Monitor API Errors
```bash
# On server
pm2 logs examsJeff | grep "\[API\].*error"
```

### Monitor Exam Edits
```bash
pm2 logs examsJeff | grep "GET /api/admin/exams"
```

## Next Steps

After identifying the root cause from logs:

1. **If database issue**: Check Prisma schema and database state
2. **If auth issue**: Review `requireAdmin()` function
3. **If data parsing issue**: Review section/question data structure
4. **If not found issue**: Verify exam exists in database

## Notes

- Enhanced logging is temporary for debugging
- Once issue is identified, can reduce logging verbosity
- All changes are backward compatible
- No database schema changes required

## Support

If error persists after deployment:

1. Check browser console for client-side error details
2. Check server logs for server-side error details:
   ```bash
   ssh root@exams.jeff.az
   pm2 logs examsJeff --lines 200 --err
   ```
3. Check Nginx logs:
   ```bash
   sudo tail -n 100 /var/log/nginx/aimentor_error.log
   ```
4. Verify database connectivity:
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   ```

## Date
2026-03-29

## Author  
AI Assistant
