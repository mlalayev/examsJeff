# Admin Test hotfix

The screenshot's HTML `429 Too Many Requests / You have exceeded the rate limit. Please try again later.` matches `nginx-production.conf`'s error page exactly. This is separate from JSON 429 responses from Next.js autosave. Confirm the active server configuration before editing it; changing this repository file or restarting PM2 does not reload Nginx.

Read-only server checks:

```bash
sudo nginx -T 2>&1 | grep -nE 'configuration file|server_name|limit_req_zone|limit_req |location.*attempts|429.html'
sudo tail -n 100 /var/log/nginx/aimentor_error.log
```

Do not share secrets or the entire nginx config publicly. Look for `limiting requests` with an `/attempts/.../run` URL. If another proxy supplies the error, inspect that proxy's limits too.

Back up the exact active config files identified above. Apply only these two changes; do NOT overwrite the whole production config with the repository template (certificate paths, upstreams and other settings may differ):

1. In the HTTP context next to the existing `limit_req_zone` declarations, add:
   `limit_req_zone $binary_remote_addr zone=exam_navigation:10m rate=10r/s;`
2. Inside `location ~ ^/attempts/.+/run$`, replace
   `limit_req zone=general burst=10 nodelay;`
   with `limit_req zone=exam_navigation burst=60 nodelay;`.

This keeps a bounded IP limit on exam navigation while separating it from dashboard/image/audio requests. It is not an auth bypass; the application still enforces access. Validate traffic and tune for shared-network concurrency if needed. Auth/upload/AI limits remain unchanged.

Then run `sudo nginx -t && sudo systemctl reload nginx`. If validation fails, do not reload; fix or restore the backed-up files.

Deploy the updated application and run `npm run build && pm2 restart examsJeff --update-env`. No database migration is needed. Every admin Test click now starts a fresh booking/attempt with a new ID; old responses are retained. Old local timer/module locks remain attached only to the old ID. Ordinary student resume is unchanged.

Verify: Test -> answer/lock module -> back to exam list -> Test again -> different attempt URL, fresh timer and selectable answers. Repeat after a completed test. Verify a normal student's resume retains answers. The real production proxy configuration has not been inspected or reloaded by this task.
