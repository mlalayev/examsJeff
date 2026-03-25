# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Review all changes in `CHANGES_SUMMARY.md`
- [ ] Verify `OPENAI_API_KEY` is set in your environment
- [ ] Check that `.env.example` matches your actual `.env` file
- [ ] Run `npm install` (no new dependencies needed)
- [ ] Build the project: `npm run build`

## Files Changed

### New Files Created ✨
- [ ] `src/lib/rate-limiter.ts` - Rate limiting system
- [ ] `AI_RATE_LIMITING.md` - Documentation
- [ ] `CHANGES_SUMMARY.md` - Summary of changes
- [ ] `.env.example` - Environment variable template
- [ ] `test-rate-limit.js` - Testing script
- [ ] `frontend-rate-limit-example.tsx` - Frontend integration examples

### Files Modified 🔧
- [ ] `src/lib/openai-client.ts` - Added timeout, retries, error handling
- [ ] `src/app/api/attempts/[attemptId]/writing/ai-score/route.ts` - Rate limiting + error handling
- [ ] `src/app/api/attempts/[attemptId]/speaking/ai-score/route.ts` - Rate limiting + error handling
- [ ] `src/app/api/attempts/[attemptId]/speaking/transcribe/route.ts` - Rate limiting + error handling
- [ ] `src/app/api/ai-writing-score/route.ts` - Rate limiting + error handling

## Testing Before Deployment

### 1. Test Rate Limiting
```bash
# Update credentials in test-rate-limit.js first
node test-rate-limit.js
```

Expected result: First 10 requests succeed, 11th returns 429

### 2. Test AI Scoring Manually
- [ ] Login as teacher/admin
- [ ] Open a submitted exam
- [ ] Click "AI Score" button
- [ ] Verify it works without errors
- [ ] Click 11 times rapidly - should see rate limit error

### 3. Check Error Handling
- [ ] Temporarily set wrong `OPENAI_API_KEY`
- [ ] Try to score - should see clear error message
- [ ] Restore correct API key

### 4. Verify Response Headers
- [ ] Open browser DevTools → Network tab
- [ ] Make an AI scoring request
- [ ] Check for these headers:
  - `X-RateLimit-Limit: 10`
  - `X-RateLimit-Remaining: 9` (or less)
  - `X-RateLimit-Reset: 60` (or less)

## Deployment Steps

### For Development
```bash
npm run dev
```

### For Production (Self-Hosted)
```bash
# Build
npm run build

# Start
npm run start

# Or with PM2
pm2 restart aimentor
```

### For Vercel/Netlify
```bash
git add .
git commit -m "Add rate limiting and protection for AI exam checker"
git push origin main
```

## Post-Deployment Verification

### 1. Check Server Logs
```bash
# Look for these patterns
tail -f logs/server.log | grep -E "(429|rate limit|OpenAI)"
```

### 2. Monitor First Hour
- [ ] Watch for 429 responses (rate limits working)
- [ ] Check OpenAI API usage dashboard
- [ ] Verify no server errors
- [ ] Test from different user accounts

### 3. User Communication
Send notification to teachers/admins:

```
📢 AI Scoring Update

We've added protection to prevent API abuse:
- Rate limit: 10 AI scorings per minute
- If you see "Too many requests", wait 1 minute
- Cached scores load instantly (no limit)

This ensures stable service for everyone!
```

## Rollback Plan

If issues occur:

1. **Quick rollback** (if using git):
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual rollback**:
   - Remove `src/lib/rate-limiter.ts`
   - Restore original versions of modified files from backup
   - Restart server

3. **Temporary fix** (increase limits):
   Edit each route file, change:
   ```typescript
   checkRateLimit(user.id, 10, 60 * 1000)
   // to
   checkRateLimit(user.id, 100, 60 * 1000)  // 10x more lenient
   ```

## Monitoring After Deployment

### Key Metrics to Watch

1. **Rate Limit Hits**
   - How many users are getting 429?
   - Are limits too strict?

2. **OpenAI Errors**
   - Any 429 from OpenAI itself?
   - Quota issues?

3. **Response Times**
   - AI scoring completion time
   - Any timeouts?

4. **Error Rate**
   - Increase in 500 errors?
   - Any new error patterns?

### Adjustment Guidelines

**If users complain rate limits are too strict:**
- Increase from 10 to 15 or 20 requests/minute
- Or increase window from 60s to 120s

**If server still getting blocked:**
- Decrease limits (make stricter)
- Add IP-based rate limiting
- Consider request queue system

**If OpenAI quota issues:**
- Reduce rate limits
- Upgrade OpenAI plan
- Implement caching more aggressively

## Success Criteria

✅ Rate limiting is working (see 429 responses when exceeded)
✅ No increase in server errors
✅ AI scoring still works normally for normal usage
✅ Clear error messages when limits hit
✅ No reports of Hetzner blocking
✅ OpenAI API usage is controlled

## Emergency Contacts

- **OpenAI Support**: https://help.openai.com/
- **Hetzner Support**: https://www.hetzner.com/support
- **Your Team**: [Add contact info]

## Additional Resources

- `AI_RATE_LIMITING.md` - Full documentation
- `CHANGES_SUMMARY.md` - What changed and why
- `frontend-rate-limit-example.tsx` - Frontend integration guide
- `test-rate-limit.js` - Testing script

---

**Last Updated**: 2026-03-24
**Status**: Ready for deployment ✅
