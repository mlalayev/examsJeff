# Deployment Instructions

## After updating Nginx configuration

When you update `nginx-production.conf`, you need to:

1. **Copy the updated configuration to the server:**
   ```bash
   sudo cp nginx-production.conf /etc/nginx/sites-available/aimentor
   ```

2. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

3. **If the test passes, reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Check for errors:**
   ```bash
   sudo tail -f /var/log/nginx/aimentor_error.log
   ```

## After updating Next.js code

1. **Rebuild the application:**
   ```bash
   npm run build
   ```

2. **Restart the PM2 process:**
   ```bash
   pm2 restart aimentor
   ```

3. **Check application status:**
   ```bash
   pm2 logs aimentor
   ```

## Upload Size Fix Applied

The following changes have been made to fix the 413 error for IELTS listening audio uploads:

1. **Next.js API Route** (`src/app/api/admin/upload/route.ts`):
   - Added runtime configuration for Node.js
   - Set `maxDuration` to 60 seconds for long uploads
   - Added explicit body parser configuration

2. **Nginx Configuration** (`nginx-production.conf`):
   - Set `client_max_body_size 50M` explicitly for the upload endpoint
   - Added `client_body_buffer_size 1M` for better buffering
   - Disabled proxy buffering with `proxy_request_buffering off` to handle large files
   - Extended timeouts for upload operations

**These files need to be deployed to production for the fix to work.**
