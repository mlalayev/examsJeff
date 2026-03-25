# 📋 Quick Reference Card - AI Rate Limiting

## 🚨 Quick Fixes

### Users Getting "Too many requests"
```typescript
// Edit: src/lib/rate-limit-config.ts
maxRequests: 20,  // Increase from 10
```

### OpenAI Quota Exceeded
1. Check: https://platform.openai.com/usage
2. Upgrade plan or wait for reset
3. Contact support if urgent

### Server Still Blocked
1. Verify rate limiting: Check response headers
2. Check Hetzner logs: `journalctl -u nginx`
3. Contact Hetzner with evidence

## 📊 Current Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Writing AI Score | 10 | 1 min |
| Speaking AI Score | 10 | 1 min |
| Audio Transcribe | 20 | 1 min |
| Generic AI Score | 10 | 1 min |

## 🔧 Important Files

| File | Purpose |
|------|---------|
| `src/lib/rate-limit-config.ts` | Change limits here |
| `src/lib/rate-limiter.ts` | Core logic (don't change) |
| `AI_RATE_LIMITING.md` | Full docs |
| `README_FINAL.md` | Complete guide |

## 🧪 Testing Commands

```bash
# Test rate limiting
node test-rate-limit.js

# Check linter
npm run lint

# Build
npm run build

# Start production
npm run start

# Restart PM2
pm2 restart aimentor
```

## 📡 Check If Working

1. **Response Headers** (DevTools → Network)
   - `X-RateLimit-Limit: 10`
   - `X-RateLimit-Remaining: 9`
   - `X-RateLimit-Reset: 60`

2. **Rapid Clicking Test**
   - Click AI Score 11 times
   - 11th should show error

3. **Server Logs**
   ```bash
   tail -f logs/app.log | grep 429
   ```

## 🎯 Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | ✅ All good |
| 429 | Rate limited | ⏱️ Wait `resetIn` seconds |
| 500 | Server error | 🐛 Check logs |
| 503 | OpenAI unavailable | ⏰ Try later |

## 🔐 Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Check if set
echo $OPENAI_API_KEY
```

## 📞 Emergency Contacts

- **OpenAI**: https://help.openai.com/
- **Hetzner**: support@hetzner.com
- **Server**: [Your team contact]

## 🚀 Deploy Checklist

- [ ] Set OPENAI_API_KEY
- [ ] Run tests
- [ ] Build project
- [ ] Restart server
- [ ] Monitor logs (1 hour)
- [ ] Check user feedback

## 💡 Common Errors

### "OPENAI_API_KEY is not set"
```bash
# Add to .env
OPENAI_API_KEY=sk-your-key-here

# Restart server
pm2 restart aimentor
```

### "No response from OpenAI"
- Check internet connection
- Verify API key is valid
- Check OpenAI status: https://status.openai.com/

### "Request timeout"
- Increase timeout in `rate-limit-config.ts`:
```typescript
export const ROUTE_CONFIG = {
  maxDuration: 120,  // 2 minutes
};
```

## 📈 Monitoring

```bash
# Watch for rate limits
tail -f logs/app.log | grep "429"

# Watch for OpenAI errors
tail -f logs/app.log | grep "OpenAI"

# Server resources
htop  # or top
```

## 🎨 Frontend Integration

```typescript
// Show remaining requests
const remaining = response.headers.get('X-RateLimit-Remaining');
console.log(`${remaining} requests remaining`);

// Handle rate limit
if (response.status === 429) {
  const data = await response.json();
  alert(`Wait ${data.resetIn} seconds`);
}
```

## 🔄 Rollback Plan

```bash
# If something breaks
git revert HEAD
git push origin main

# Or temporarily disable rate limiting
# Edit rate-limit-config.ts:
maxRequests: 999999,  # Effectively unlimited
```

## 📚 Documentation

1. **README_FINAL.md** - Start here
2. **AI_RATE_LIMITING.md** - Deep dive
3. **DEPLOYMENT_CHECKLIST.md** - Deploy guide
4. **FLOW_DIAGRAM.md** - Visual guide
5. **CHANGES_SUMMARY.md** - What changed

---

**Print this and keep it handy! 📌**

**Need help?** Read `README_FINAL.md` first
**Emergency?** Check logs: `tail -f logs/app.log`
**Want to adjust?** Edit `src/lib/rate-limit-config.ts`
