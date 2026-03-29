# Quick Fix Guide: 413 Error for Audio Upload

## What's the problem?
You're getting "413 Request Entity Too Large" when uploading audio files for IELTS listening sections.

## Why does it happen?
The server (Nginx) has a default limit that's too small for large audio files.

## What was fixed?

### ✅ Code Changes (Already Done)
1. **API Route** - Better error handling
2. **Client-Side Validation** - Checks file size before upload (50MB max)
3. **Nginx Config** - Increased body size limit to 50MB
4. **Next.js Config** - Updated server action limits

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

1. Go to admin panel
2. Create/edit an IELTS exam
3. Upload audio to Listening section
4. Should work for files up to 50MB

## Still not working?

Check `DEPLOYMENT_INSTRUCTIONS.md` for detailed troubleshooting steps.
