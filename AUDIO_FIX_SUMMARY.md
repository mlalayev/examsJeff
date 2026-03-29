# Audio Upload & Playback Fix - Complete Summary

## Issues Fixed

### 1. ❌ 413 Request Entity Too Large (Upload Error)
**Symptom:** Cannot upload audio files for IELTS listening sections

**Root Cause:** 
- Nginx default body size limit was too small
- Next.js body parser limit was restrictive

**Solution:**
- Increased Nginx `client_max_body_size` to 50MB for upload endpoint
- Added client-side validation to check file size before upload
- Improved error messages

### 2. ❌ 404 Not Found (Playback Error)  
**Symptom:** Audio files upload successfully but return 404 when playing, even though files exist at `/root/examsJeff/public/audio/`

**Root Cause:**
- Nginx was proxying `/audio/` requests to Next.js backend
- Next.js couldn't properly serve the static files
- Files existed but weren't accessible via web

**Solution:**
- Changed Nginx to serve audio files directly from filesystem
- Added proper MIME types for audio files
- Enabled range requests for audio seeking
- Added dedicated logging for debugging

## Files Modified

1. **nginx-production.conf** - Most important file
   - Increased upload size limits
   - Changed `/audio/` location to serve directly from `/root/examsJeff/public/audio/`
   - Added `/images/` location for images
   - Added proper audio MIME types

2. **src/app/api/admin/upload/route.ts**
   - Improved error handling
   - Better formData parsing

3. **src/components/admin/exams/create/SectionCard.tsx**
   - Client-side file size validation
   - Better error messages

4. **src/app/dashboard/admin/exams/[id]/edit/page.tsx**
   - Client-side file size validation
   - Better error messages

5. **next.config.mjs**
   - Added server action body size limit

6. **.env**
   - Added file size limit environment variables

## Deployment Checklist

Use this checklist when deploying to production:

```bash
# ☐ 1. SSH to server
ssh root@exams.jeff.az
cd /root/examsJeff

# ☐ 2. Pull latest code
git pull origin main

# ☐ 3. Update environment variables
echo "MAX_AUDIO_FILE_SIZE_BYTES=52428800" >> .env
echo "MAX_IMAGE_FILE_SIZE_BYTES=5242880" >> .env

# ☐ 4. Rebuild Next.js
npm install
npm run build

# ☐ 5. Restart Next.js
pm2 restart aimentor
pm2 logs aimentor --lines 20

# ☐ 6. Update Nginx configuration (CRITICAL!)
sudo cp nginx-production.conf /etc/nginx/sites-available/aimentor
sudo nginx -t
sudo systemctl reload nginx

# ☐ 7. Fix file permissions (if needed)
sudo chown -R www-data:www-data /root/examsJeff/public/audio/
sudo chmod 755 /root/examsJeff/public/audio/
sudo chmod 644 /root/examsJeff/public/audio/*.mp3

# ☐ 8. Run verification script
chmod +x verify-audio.sh
./verify-audio.sh

# ☐ 9. Test manually
# - Upload an audio file
# - Verify it plays without 404 error
# - Check browser console for any errors

# ☐ 10. Monitor logs
sudo tail -f /var/log/nginx/aimentor_error.log
# (Press Ctrl+C to stop)
```

## Testing Steps

1. **Upload Test:**
   - Go to https://exams.jeff.az/dashboard/admin/exams/create
   - Create an IELTS exam
   - Add a Listening section
   - Upload an audio file (< 50MB)
   - Should upload successfully

2. **Playback Test:**
   - After uploading, the audio player should appear
   - Click play
   - Audio should load and play without 404 errors
   - Seeking (scrubbing) should work

3. **Size Validation Test:**
   - Try uploading a file > 50MB
   - Should show error message before upload

## Verification Commands

```bash
# Check if files exist
ls -la /root/examsJeff/public/audio/

# Test HTTP access to a specific file
curl -I https://exams.jeff.az/audio/YOUR_FILE.mp3
# Should return: HTTP/2 200
# Should include: content-type: audio/mpeg

# Check Nginx config for audio location
grep -A 30 "location.*audio" /etc/nginx/sites-available/aimentor

# Check Nginx logs for audio errors
sudo tail -50 /var/log/nginx/audio_error.log

# Check main Nginx error log
sudo tail -50 /var/log/nginx/aimentor_error.log
```

## Expected Nginx Audio Configuration

Your Nginx config should include this section:

```nginx
location ~ ^/audio/ {
    # Serve from the public directory
    alias /root/examsJeff/public/audio/;
    
    # Allow range requests for audio seeking
    add_header Accept-Ranges bytes;
    
    # CORS headers (if needed for cross-origin requests)
    add_header Access-Control-Allow-Origin *;
    
    # Cache headers
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    
    # Correct MIME types
    types {
        audio/mpeg mp3;
        audio/wav wav;
        audio/ogg ogg;
        audio/mp4 m4a;
        audio/aac aac;
        audio/flac flac;
        audio/x-ms-wma wma;
        audio/webm webm;
    }
    
    # Rate limiting
    limit_req zone=general burst=10 nodelay;
    
    # Logging
    access_log /var/log/nginx/audio_access.log;
    error_log /var/log/nginx/audio_error.log;
}
```

## Common Issues & Solutions

### Issue: 404 Still Occurs After Deployment

**Solution:**
1. Check file permissions:
   ```bash
   sudo chown -R www-data:www-data /root/examsJeff/public/audio/
   sudo chmod 755 /root/examsJeff/public/audio/
   sudo chmod 644 /root/examsJeff/public/audio/*.mp3
   ```

2. Verify Nginx was reloaded:
   ```bash
   sudo systemctl reload nginx
   ```

3. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/aimentor_error.log
   ```

### Issue: 413 Still Occurs

**Solution:**
1. Verify Nginx config was updated:
   ```bash
   grep -A 10 "api/admin/upload" /etc/nginx/sites-available/aimentor
   ```
   Should show `client_max_body_size 50M;`

2. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

### Issue: Audio Plays But Can't Seek/Scrub

**Solution:**
Check that Nginx audio location has:
```nginx
add_header Accept-Ranges bytes;
```

## File Size Limits

- **Audio files:** Maximum 50MB (52,428,800 bytes)
- **Image files:** Maximum 5MB (5,242,880 bytes)

## Support Files Created

1. **DEPLOYMENT_INSTRUCTIONS.md** - Detailed deployment guide
2. **QUICK_FIX_GUIDE.md** - Quick reference
3. **verify-audio.sh** - Automated verification script
4. **AUDIO_FIX_SUMMARY.md** - This file

## Success Indicators

✅ Files upload without 413 error
✅ Audio files play without 404 error  
✅ Audio seeking/scrubbing works
✅ verify-audio.sh script shows all green checkmarks
✅ curl test returns HTTP 200 with audio/mpeg content-type
✅ No errors in Nginx logs

## Contact Points

If issues persist after following all steps:

1. Check **DEPLOYMENT_INSTRUCTIONS.md** troubleshooting section
2. Run **verify-audio.sh** script and review output
3. Check Nginx logs: `sudo tail -100 /var/log/nginx/aimentor_error.log`
4. Check PM2 logs: `pm2 logs aimentor --lines 100`
