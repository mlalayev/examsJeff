# Quick Fix Guide: 413 Error + 404 Audio Error

## What are the problems?

### Problem 1: 413 Request Entity Too Large
You're getting "413 Request Entity Too Large" when uploading audio files for IELTS listening sections.

### Problem 2: 404 Not Found for Audio
Audio files upload successfully but return 404 errors when trying to play them, even though the files exist at `/root/examsJeff/public/audio/`.

## Why do they happen?

### Problem 1: 
The server (Nginx) has a default limit that's too small for large audio files.

### Problem 2:
Nginx was proxying `/audio/` requests to Next.js, but Next.js couldn't serve the static files properly. Now Nginx serves them directly from the filesystem.

## What was fixed?

### ✅ Code Changes (Already Done)
1. **API Route** - Better error handling
2. **Client-Side Validation** - Checks file size before upload (50MB max)
3. **Nginx Config** - Increased body size limit to 50MB
4. **Nginx Config** - Changed `/audio/` to serve directly from `/root/examsJeff/public/audio/`
5. **Nginx Config** - Added proper MIME types and range request support
6. **Next.js Config** - Updated server action limits

### ⚠️ What YOU Need to Do (CRITICAL!)

The code changes are done, but **you MUST deploy them to your production server** at `exams.jeff.az`:

```bash
# 1. SSH to server
ssh user@exams.jeff.az

# 2. Go to project directory
cd /path/to/aimentor

# 3. Pull latest code
git pull origin main

# 4. Add environment variables
echo "MAX_AUDIO_FILE_SIZE_BYTES=52428800" >> .env
echo "MAX_IMAGE_FILE_SIZE_BYTES=5242880" >> .env

# 5. Rebuild Next.js
npm install
npm run build
pm2 restart aimentor

# 6. Update Nginx (MOST IMPORTANT!)
sudo cp nginx-production.conf /etc/nginx/sites-available/aimentor
sudo nginx -t
sudo systemctl reload nginx

# 7. Verify
sudo tail -f /var/log/nginx/aimentor_error.log
```

## How to test if it works?

1. Go to admin panel at `https://exams.jeff.az/`
2. Create/edit an IELTS exam
3. Upload audio to Listening section (should work for files up to 50MB)
4. **Test playback** - Click play on the uploaded audio
5. Audio should load and play without 404 errors

## Quick verification commands on server:

```bash
# Check if files exist
ls -la /root/examsJeff/public/audio/

# Test if Nginx can serve the file
curl -I https://exams.jeff.az/audio/YOUR_FILE.mp3

# Check permissions (should show www-data or correct user)
ls -la /root/examsJeff/public/audio/

# Fix permissions if needed
sudo chown -R www-data:www-data /root/examsJeff/public/audio/
sudo chmod 755 /root/examsJeff/public/audio/
sudo chmod 644 /root/examsJeff/public/audio/*.mp3
```

## Still not working?

Check `DEPLOYMENT_INSTRUCTIONS.md` for detailed troubleshooting steps.
