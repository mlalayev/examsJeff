# Deployment Instructions for 413 Upload Error Fix

## Problem
When uploading audio files for IELTS listening sections, users get a "413 Request Entity Too Large" error. This happens because:
1. Nginx has a default body size limit
2. Next.js has a default body parser limit

## Solution Applied

### Changes Made

**1. Next.js API Route Configuration** (`src/app/api/admin/upload/route.ts`):
- Added runtime and timeout configuration
- Improved error handling with specific 413 error messages
- Better formData parsing with try-catch

**2. Next.js Config** (`next.config.mjs`):
- Added `serverActions.bodySizeLimit: '50mb'` for server actions

**3. Nginx Configuration** (`nginx-production.conf`):
- Explicitly set `client_max_body_size 50M` for upload endpoint
- Added `client_body_buffer_size 1M`
- Disabled proxy buffering for streaming large files
- Extended timeouts for upload operations

**4. Client-Side Validation** (Added to both create and edit pages):
- Check file size before upload (50MB limit)
- Show clear error messages with file size
- Reset file input on validation failure

**5. Environment Variables** (`.env`):
- Added `MAX_AUDIO_FILE_SIZE_BYTES=52428800` (50MB)
- Added `MAX_IMAGE_FILE_SIZE_BYTES=5242880` (5MB)

## Deployment Steps (IMPORTANT!)

### Step 1: Update the Production Server

SSH into your server and navigate to the project directory:

```bash
ssh user@exams.jeff.az
cd /path/to/aimentor
```

### Step 2: Pull Latest Code

```bash
git pull origin main
```

### Step 3: Update Environment Variables

Make sure `.env` file on the server has the upload size limits:

```bash
echo "MAX_AUDIO_FILE_SIZE_BYTES=52428800" >> .env
echo "MAX_IMAGE_FILE_SIZE_BYTES=5242880" >> .env
```

### Step 4: Rebuild Next.js Application

```bash
npm install
npm run build
```

### Step 5: Restart Next.js (PM2)

```bash
pm2 restart aimentor
pm2 logs aimentor --lines 50
```

### Step 6: Update Nginx Configuration

**CRITICAL STEP** - The Nginx configuration must be updated:

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/aimentor /etc/nginx/sites-available/aimentor.backup

# Copy new config
sudo cp /path/to/aimentor/nginx-production.conf /etc/nginx/sites-available/aimentor

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check for errors
sudo tail -f /var/log/nginx/aimentor_error.log
```

### Step 7: Verify the Fix

1. Log into the admin panel at `http://exams.jeff.az/`
2. Create or edit an IELTS exam
3. Try uploading an audio file to the Listening section
4. Verify that:
   - Files under 50MB upload successfully
   - Files over 50MB show a clear error message before upload
   - The 413 error is gone

### Step 8: Monitor Logs

```bash
# Watch Nginx logs
sudo tail -f /var/log/nginx/aimentor_error.log

# Watch PM2 logs
pm2 logs aimentor
```

## Testing Locally

To test locally before deploying:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Try uploading audio files of various sizes
3. Check that client-side validation works (files > 50MB are rejected immediately)

## Troubleshooting

### If 413 Error Still Occurs:

1. **Check Nginx is using the new config:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

2. **Verify Nginx was reloaded:**
   ```bash
   sudo systemctl reload nginx
   # or
   sudo systemctl restart nginx
   ```

3. **Check Nginx error logs:**
   ```bash
   sudo tail -100 /var/log/nginx/aimentor_error.log | grep "413\|client_max_body_size"
   ```

4. **Verify the upload endpoint config:**
   ```bash
   grep -A 20 "api/admin/upload" /etc/nginx/sites-available/aimentor
   ```
   Should show `client_max_body_size 50M;`

5. **Check Next.js is rebuilt:**
   ```bash
   ls -la /path/to/aimentor/.next/
   pm2 logs aimentor --lines 100
   ```

### If File Uploads Are Slow:

This is normal for large audio files. The upload timeout is set to 60-90 seconds to handle slow connections.

## File Size Limits

- **Audio files:** Maximum 50MB (52,428,800 bytes)
- **Image files:** Maximum 5MB (5,242,880 bytes)

If you need to increase these limits, update:
1. `.env` file (both variables)
2. `nginx-production.conf` (client_max_body_size)
3. Redeploy following steps above
