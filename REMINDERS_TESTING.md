# Testing Exam Reminders

This guide explains how to test the exam reminder system locally.

## Overview

The reminder system sends notifications to both students and teachers:
- **24 hours before** the exam starts
- **1 hour before** the exam starts

Notifications are sent via:
- 📧 **Email** (logs to console in dev mode, SMTP in production)
- 🔔 **In-app notifications** (bell icon in navbar)

## How It Works

1. **When you create a booking**, the `reminded24h` and `reminded1h` flags are set to `false`
2. **Cron job runs every 15 minutes** checking for bookings that need reminders
3. **Time windows** (with 20-minute buffer):
   - 24h reminder: checks bookings between `now+23h40m` and `now+24h20m`
   - 1h reminder: checks bookings between `now+40m` and `now+1h20m`
4. **Sends emails and creates Notification rows**, then sets flags to `true`
5. **Idempotency ensured** by the flags - no duplicate reminders

## Testing Locally

### Method 1: Manual Cron Trigger (Recommended for Testing)

1. **Create a booking** with start time ~2 hours from now:
   ```
   - Login as teacher
   - Go to class roster
   - Assign exam to student
   - Set start time: today at [current time + 2 hours]
   ```

2. **Manually trigger the cron endpoint**:
   ```bash
   # Using curl (PowerShell)
   curl -H "Authorization: Bearer dev-secret-change-in-production" http://localhost:3000/api/cron/reminders

   # Or using browser/Postman
   # GET http://localhost:3000/api/cron/reminders
   # Header: Authorization: Bearer dev-secret-change-in-production
   ```

3. **Check console output**:
   ```
   📧 ================== EMAIL (DEV MODE) ==================
   To: student@example.com
   Subject: Reminder: IELTS Academic Mock Exam #1 in 1 hour
   Message:
   ...
   ========================================================
   ```

4. **Check notifications**:
   - Login as student
   - Click bell icon in navbar
   - Should see notification: "Exam Starting Soon!"

### Method 2: Modify Time Windows (For Immediate Testing)

**Temporarily modify** `src/app/api/cron/reminders/route.ts`:

```typescript
// ORIGINAL (for 1h reminder):
const window1hStart = new Date(now.getTime() + 40 * 60 * 1000);
const window1hEnd = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 20 * 60 * 1000);

// TEMPORARY (for testing - 2 minute window):
const window1hStart = new Date(now.getTime() + 1 * 60 * 1000);
const window1hEnd = new Date(now.getTime() + 3 * 60 * 1000);
```

Then:
1. Create booking with start time **2 minutes from now**
2. Wait 30 seconds
3. Trigger cron endpoint
4. Check console and notifications

**⚠️ Remember to revert changes after testing!**

### Method 3: Test in Production (Vercel)

Once deployed to Vercel:

1. Cron will run **automatically every 15 minutes**
2. Check Vercel logs:
   ```
   Dashboard → Functions → /api/cron/reminders → Logs
   ```
3. Configure SMTP in environment variables for real emails:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=JEFF Exams <noreply@jeffexams.com>
   ```

## Verification Checklist

✅ **24h reminder sent**:
- [ ] Email logged to console (dev) or sent (prod)
- [ ] Student receives notification
- [ ] Teacher receives notification
- [ ] Notification rows created in database
- [ ] `reminded24h` flag set to `true`

✅ **1h reminder sent**:
- [ ] Email logged to console (dev) or sent (prod)
- [ ] Student receives notification
- [ ] Teacher receives notification
- [ ] Notification rows created in database
- [ ] `reminded1h` flag set to `true`

✅ **No duplicates**:
- [ ] Running cron multiple times doesn't resend notifications
- [ ] Flags prevent duplicate reminders

## Database Queries

Check reminders in database:

```sql
-- View all notifications
SELECT * FROM notifications ORDER BY "createdAt" DESC LIMIT 10;

-- Check booking reminder flags
SELECT id, "examId", "startAt", reminded24h, reminded1h, status 
FROM bookings 
ORDER BY "startAt" ASC;

-- Count notifications by type
SELECT 
  meta->>'type' as reminder_type,
  COUNT(*) as count
FROM notifications
GROUP BY meta->>'type';
```

## Troubleshooting

**Reminders not sending?**
1. Check server logs for errors
2. Verify CRON_SECRET matches in .env
3. Ensure booking status is "CONFIRMED" or "IN_PROGRESS"
4. Check time windows are correct
5. Verify flags are `false` before cron runs

**Emails not sending?**
- In development: Check console output
- In production: Verify SMTP credentials
- Test SMTP connection separately

**Notifications not showing?**
- Refresh navbar (closes/opens bell dropdown)
- Check browser console for API errors
- Verify user is authenticated

## Production Setup

1. **Set CRON_SECRET in Vercel**:
   ```bash
   vercel env add CRON_SECRET production
   # Enter a secure random string
   ```

2. **Configure SMTP** (optional):
   ```bash
   vercel env add SMTP_HOST production
   vercel env add SMTP_PORT production
   vercel env add SMTP_USER production
   vercel env add SMTP_PASSWORD production
   vercel env add SMTP_FROM production
   ```

3. **Deploy**:
   ```bash
   git push
   ```

4. **Verify cron is running**:
   - Vercel Dashboard → Settings → Crons
   - Should see: `/api/cron/reminders` running every 15 minutes

## Notes

- All times stored in **UTC** in database
- UI displays in **Asia/Baku** timezone
- Cron runs every **15 minutes** (configurable in `vercel.json`)
- 20-minute buffer ensures reminders aren't missed if cron is delayed
- Flags ensure **idempotency** - safe to run cron multiple times

