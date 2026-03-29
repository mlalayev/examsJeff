# Microphone Permission Fix - Deployment Instructions

## Problem
Browser was blocking microphone access during IELTS speaking exams due to Permissions-Policy headers in Nginx configuration.

**Error messages:**
```
Permissions policy violation: microphone is not allowed in this document.
Microphone permission error: NotAllowedError: Permission denied
```

## Solution
Modified Nginx configuration to allow microphone access only on exam pages while keeping other pages secure.

## Files Changed

1. **nginx-production.conf**
   - Modified default Permissions-Policy header with comment
   - Added new location block for exam pages with microphone=(self)
   
2. **src/app/layout.tsx**
   - Added default Permissions-Policy in metadata
   
3. **src/app/attempts/[attemptId]/run/layout.tsx** (NEW)
   - Created layout with microphone=(self) override for exam pages

## Deployment Steps

### 1. Backup Current Configuration
```bash
ssh root@exams.jeff.az
sudo cp /etc/nginx/sites-available/aimentor /etc/nginx/sites-available/aimentor.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Upload New Nginx Configuration
```bash
# From local machine (Git Bash or WSL)
scp nginx-production.conf root@exams.jeff.az:/tmp/nginx-aimentor-new.conf

# On server
ssh root@exams.jeff.az
sudo mv /tmp/nginx-aimentor-new.conf /etc/nginx/sites-available/aimentor
```

### 3. Test Nginx Configuration
```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Reload Nginx (if test passes)
```bash
sudo systemctl reload nginx
```

### 5. Deploy Next.js Changes
```bash
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

### 6. Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs examsJeff --lines 50

# Check Nginx logs
sudo tail -f /var/log/nginx/aimentor_error.log
```

### 7. Test in Browser

1. Go to: https://exams.jeff.az
2. Login and start an IELTS speaking exam
3. Browser should prompt for microphone permission
4. After allowing, recording should start without errors
5. Check browser console (F12) - should have NO "Permissions policy violation" errors

## Rollback Instructions (if needed)

If there are any issues:

```bash
# Restore backup Nginx config
ssh root@exams.jeff.az
sudo cp /etc/nginx/sites-available/aimentor.backup.YYYYMMDD_HHMMSS /etc/nginx/sites-available/aimentor
sudo nginx -t
sudo systemctl reload nginx

# Rollback Next.js (if needed)
cd /root/examsJeff
git log --oneline -n 5  # See recent commits
git reset --hard COMMIT_HASH  # Replace with previous working commit
npm run build
pm2 restart examsJeff
```

## Security Notes

### What Changed
- **Before**: All pages blocked microphone with `microphone=()`
- **After**: 
  - Default: All pages still block microphone `microphone=()`
  - Exception: Exam run pages allow microphone `microphone=(self)`
  - `(self)` means only same-origin can access, no cross-origin access

### Why This Is Secure
1. Only exam pages (`/dashboard/*/run` and `/attempts/*/run`) allow microphone
2. Other pages (dashboard, admin, etc.) still block microphone
3. No cross-origin access allowed (only same domain)
4. Camera and geolocation remain blocked on all pages

### URL Patterns That Allow Microphone
```
/attempts/*/run
```

Examples:
- `/attempts/cm123abc/run` ✓
- `/attempts/cm456def/run` ✓
- `/dashboard` ✗
- `/admin` ✗

## Testing Checklist

- [ ] Nginx config test passes (`nginx -t`)
- [ ] Nginx reloaded successfully
- [ ] Next.js build successful
- [ ] PM2 restart successful
- [ ] IELTS speaking exam allows microphone
- [ ] Other pages still block microphone
- [ ] No console errors in exam page
- [ ] Recording works end-to-end
- [ ] Transcription works correctly

## Monitoring

After deployment, monitor for:

```bash
# Check for permission errors
sudo grep "Permissions policy" /var/log/nginx/aimentor_error.log

# Check for microphone errors in application
pm2 logs examsJeff | grep -i "microphone"

# Monitor Nginx access
sudo tail -f /var/log/nginx/aimentor_access.log | grep "/run"
```

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Nginx error log: `sudo tail -n 100 /var/log/nginx/aimentor_error.log`
3. Check application log: `pm2 logs examsJeff --lines 100`
4. Verify microphone works in other applications (to rule out OS issues)
5. Try different browser (Chrome, Firefox, Edge)

## Changes Summary

### Nginx Configuration
```nginx
# Added new location block BEFORE the main / location:
location ~ ^/attempts/.+/run$ {
    # Override Permissions-Policy to allow microphone for exam pages
    add_header Permissions-Policy "camera=(), microphone=(self), geolocation=()" always;
    # ... proxy settings ...
}
```

### Next.js Changes
1. Root layout: Added default Permissions-Policy in metadata
2. Exam run layout: Added microphone=(self) override in metadata

## Date
2026-03-29

## Author
AI Assistant
