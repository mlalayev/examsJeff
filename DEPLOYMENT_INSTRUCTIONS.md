# Deployment Instructions for 413 Upload Error Fix + Audio 404 Fix

## Problems Addressed

### 1. 413 Request Entity Too Large
When uploading audio files for IELTS listening sections, users get a "413 Request Entity Too Large" error.

### 2. 404 Not Found for Audio Files
Audio files upload successfully but return 404 errors when trying to play them, even though the files exist on the server at `/root/examsJeff/public/audio/`.

## Root Causes

### Problem 1 (413 Error):
1. Nginx has a default body size limit
2. Next.js has a default body parser limit

### Problem 2 (404 Error):
- Nginx was proxying `/audio/` requests to Next.js backend
- Next.js couldn't properly serve the static files
- Files exist but weren't accessible via the web

## Solutions Applied

### Changes Made

**1. Next.js API Route Configuration** (`src/app/api/admin/upload/route.ts`):
- Added runtime and timeout configuration
- Improved error handling with specific 413 error messages
- Better formData parsing with try-catch

**2. Next.js Config** (`next.config.mjs`):
- Added `serverActions.bodySizeLimit: '50mb'` for server actions

**3. Nginx Configuration** (`nginx-production.conf`):
- Set `client_max_body_size 50M` explicitly for `/api/admin/upload`
- Added `client_body_buffer_size 1M` for better memory management
- Disabled `proxy_request_buffering` and `proxy_buffering` to stream large files
- Extended all timeout values (60-90 seconds)
- **[NEW FIX] Changed `/audio/` location to serve files directly from filesystem** (`alias /root/examsJeff/public/audio/`) instead of proxying to Next.js
- **[NEW FIX] Added `/images/` location to serve image files directly from filesystem** (`alias /root/examsJeff/public/images/`)
- Added proper MIME types for audio files (mp3, wav, ogg, m4a, etc.)
- Enabled range requests for audio seeking (allows scrubbing through audio)
- Added dedicated audio access/error logs for debugging

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
sudo cp /path/to/examsJeff/nginx-production.conf /etc/nginx/sites-available/examsJeff

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

### If Audio Files Return 404 Error:

1. **Verify files exist on server:**
   ```bash
   ls -la /root/examsJeff/public/audio/
   ```
   You should see your uploaded .mp3 files

2. **Check Nginx audio location config:**
   ```bash
   grep -A 30 "location.*audio" /etc/nginx/sites-available/aimentor
   ```
   Should show `alias /root/examsJeff/public/audio/;`

3. **Test audio file access directly:**
   ```bash
   curl -I https://exams.jeff.az/audio/YOUR_FILE.mp3
   ```
   Should return `200 OK` with `Content-Type: audio/mpeg`

4. **Check file permissions:**
   ```bash
   ls -la /root/examsJeff/public/audio/
   ```
   Files should be readable by nginx user (www-data):
   ```bash
   sudo chown -R www-data:www-data /root/examsJeff/public/audio/
   sudo chmod 755 /root/examsJeff/public/audio/
   sudo chmod 644 /root/examsJeff/public/audio/*.mp3
   ```

5. **Check Nginx audio logs:**
   ```bash
   sudo tail -50 /var/log/nginx/audio_error.log
   sudo tail -50 /var/log/nginx/audio_access.log
   ```

6. **Verify the path matches:**
   - Upload API saves to: `/root/examsJeff/public/audio/`
   - Database stores: `/audio/filename.mp3`
   - Nginx serves from: `alias /root/examsJeff/public/audio/;`
   - Browser requests: `https://exams.jeff.az/audio/filename.mp3`

### If File Uploads Are Slow:

This is normal for large audio files. The upload timeout is set to 60-90 seconds to handle slow connections.

## File Size Limits

- **Audio files:** Maximum 50MB (52,428,800 bytes)
- **Image files:** Maximum 5MB (5,242,880 bytes)

If you need to increase these limits, update:
1. `.env` file (both variables)
2. `nginx-production.conf` (client_max_body_size)
3. Redeploy following steps above
