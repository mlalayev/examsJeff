# Daily and weekly parent reports

The teacher schedule has Daily reports on every date, in both week and month views.
Sundays also retain Weekly reports. The Reports picker supports either period.
Both open the existing per-student report cards with Copy, Copy all and Regenerate.
The buttons only generate/save reports; they do not send messages to parents.

Daily reports use saved feedback from one calendar day. Weekly reports continue
using Sunday through Saturday. Missing feedback is not counted as an absence.
Speaking-only lessons remain excluded, matching the existing weekly rules.
Report facts and the teacher's subject/student scope are shared between both paths.
Daily prose uses “bu gün” and a single date, including Sunday.

DailyReport uses the new daily_reports table, independently of WeeklyReport.
Teacher, class, student and date uniquely identify a saved daily report.
Regeneration replaces only the selected period, in a transaction after successful
generation; AI errors leave existing reports intact. Empty results do not show Done.
The month API returns reportDays and reportWeeks separately. The monthly student
register and existing weekly report history continue using weekly reports only.

## Deployment

After committing/pushing these changes and pulling them onto the server, run:

```sh
npx prisma migrate deploy && npm run build && pm2 restart examsJeff
```

Apply the migration before starting the new application. Existing weekly reports
are not modified. No production migration or paid live AI generation was run during
local validation; automated tests mock the provider and database.
