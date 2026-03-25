# 🔄 Migration Guide - Adding Rate Limiting to AI Exam Checker

## Overview

This guide explains how the rate limiting system was added to your AI exam checker to prevent abuse, reduce costs, and avoid IP blocking.

## What Changed

### Before
```typescript
// Old code - no protection
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  // Direct OpenAI call - no limits!
  const result = await openai.chat.completions.create({...});
  return result;
}
```

### After
```typescript
// New code - protected
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  
  // 1. Check rate limit
  const limit = RATE_LIMITS.AI_WRITING_SCORE;
  const check = checkRateLimit(user.id, limit.maxRequests, limit.windowMs);
  if (check.limited) {
    return NextResponse.json({
      error: "Too many requests",
      resetIn: check.resetIn
    }, { status: 429 });
  }
  
  // 2. Make OpenAI call with error handling
  try {
    const result = await scoreIELTSWritingFull({...});
    return result;
  } catch (error) {
    handleOpenAIError(error);
  }
}
```

## Migration Steps

### Step 1: Understand the New Architecture

```
Old Flow:
User → API → OpenAI → Response

New Flow:
User → API → Rate Check → Cache Check → OpenAI → Response
                ↓              ↓
            Reject if         Return if
            over limit        already scored
```

### Step 2: Key Components

#### 1. Rate Limiter (`src/lib/rate-limiter.ts`)
```typescript
// Tracks requests per user
checkRateLimit(userId, maxRequests, windowMs)
// Returns: { limited: boolean, remaining: number, resetIn: number }
```

#### 2. Configuration (`src/lib/rate-limit-config.ts`)
```typescript
// Centralized limits - easy to adjust
export const RATE_LIMITS = {
  AI_WRITING_SCORE: { maxRequests: 10, windowMs: 60000 }
}
```

#### 3. OpenAI Client (`src/lib/openai-client.ts`)
```typescript
// Enhanced with timeout, retries, error handling
export function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey,
    timeout: 60000,
    maxRetries: 3
  });
}
```

### Step 3: Protected Endpoints

All AI endpoints now follow this pattern:

```typescript
import { RATE_LIMITS, ROUTE_CONFIG } from "@/lib/rate-limit-config";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleOpenAIError } from "@/lib/openai-client";

export const maxDuration = ROUTE_CONFIG.maxDuration;

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  
  // Rate limit check
  const limit = RATE_LIMITS.YOUR_ENDPOINT;
  const check = checkRateLimit(user.id, limit.maxRequests, limit.windowMs);
  if (check.limited) {
    return NextResponse.json(
      { error: "Too many requests", resetIn: check.resetIn },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.maxRequests.toString(),
          "X-RateLimit-Remaining": check.remaining.toString(),
          "X-RateLimit-Reset": check.resetIn.toString(),
        }
      }
    );
  }
  
  // Your existing logic...
  try {
    const result = await callOpenAI();
    return NextResponse.json(result);
  } catch (error) {
    handleOpenAIError(error);
  }
}
```

## For Future AI Endpoints

When adding new AI-powered endpoints, follow this template:

### 1. Add to Config
```typescript
// src/lib/rate-limit-config.ts
export const RATE_LIMITS = {
  // ... existing limits
  NEW_AI_FEATURE: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    description: 'New AI feature endpoint',
  },
};
```

### 2. Implement in Route
```typescript
// src/app/api/your-new-ai-endpoint/route.ts
import { RATE_LIMITS, ROUTE_CONFIG } from "@/lib/rate-limit-config";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleOpenAIError } from "@/lib/openai-client";

export const maxDuration = ROUTE_CONFIG.maxDuration;

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  
  const limit = RATE_LIMITS.NEW_AI_FEATURE;
  const check = checkRateLimit(user.id, limit.maxRequests, limit.windowMs);
  
  if (check.limited) {
    return NextResponse.json(
      { error: "Too many requests", resetIn: check.resetIn },
      { status: 429, headers: {
        "X-RateLimit-Limit": limit.maxRequests.toString(),
        "X-RateLimit-Remaining": check.remaining.toString(),
        "X-RateLimit-Reset": check.resetIn.toString(),
      }}
    );
  }
  
  try {
    // Your AI logic here
    const result = await getOpenAI().chat.completions.create({...});
    return NextResponse.json(result);
  } catch (error) {
    handleOpenAIError(error);
  }
}
```

## Frontend Updates

### Handling Rate Limits

```typescript
async function scoreWithAI() {
  const response = await fetch('/api/ai-score', { method: 'POST' });
  
  // Check for rate limit
  if (response.status === 429) {
    const data = await response.json();
    toast.error(`Too many requests. Wait ${data.resetIn} seconds.`);
    
    // Disable button temporarily
    setButtonDisabled(true);
    setTimeout(() => setButtonDisabled(false), data.resetIn * 1000);
    return;
  }
  
  if (!response.ok) {
    const data = await response.json();
    toast.error(data.error);
    return;
  }
  
  const result = await response.json();
  // Handle success
}
```

### Showing Rate Limit Info

```typescript
function AIScoreButton() {
  const handleClick = async () => {
    const response = await fetch('/api/ai-score', { method: 'POST' });
    
    // Show remaining requests
    const remaining = response.headers.get('X-RateLimit-Remaining');
    console.log(`${remaining} AI requests remaining`);
  };
  
  return <button onClick={handleClick}>Score with AI</button>;
}
```

## Database Considerations

### No Schema Changes Required
The rate limiting is entirely in-memory, so no database migrations needed.

### Existing Cache Still Works
```typescript
// This pattern remains unchanged
if (submission?.aiScoredAt && !force) {
  return NextResponse.json({ cached: true, data: submission });
}
```

## Testing Your Changes

### Unit Tests
```typescript
// Example test for rate limiter
import rateLimiter, { checkRateLimit } from '@/lib/rate-limiter';

test('rate limiter blocks after limit', () => {
  const userId = 'test-user';
  
  // Make 10 requests (should all pass)
  for (let i = 0; i < 10; i++) {
    const check = checkRateLimit(userId, 10, 60000);
    expect(check.limited).toBe(false);
  }
  
  // 11th request should be blocked
  const check = checkRateLimit(userId, 10, 60000);
  expect(check.limited).toBe(true);
  
  // Cleanup
  rateLimiter.clear(userId);
});
```

### Integration Tests
```bash
# Use the provided test script
node test-rate-limit.js
```

## Performance Impact

### Before Rate Limiting
- Unlimited concurrent requests
- Database can be overwhelmed
- OpenAI API quota depleted rapidly

### After Rate Limiting
- Controlled request flow
- Predictable database load
- Manageable API costs

### Memory Usage
- Rate limiter uses ~1KB per active user
- Automatic cleanup every 5 minutes
- Negligible impact on server resources

## Backwards Compatibility

✅ **100% Compatible** - No breaking changes

- API endpoints unchanged
- Request/response format same
- Only adds new 429 status code
- Frontend works without changes (graceful degradation)

## Troubleshooting

### Rate Limiter Not Working
```typescript
// Check if imports are correct
import { checkRateLimit } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/lib/rate-limit-config";

// Verify config is loaded
console.log(RATE_LIMITS); // Should show your limits
```

### Limits Too Strict/Loose
```typescript
// Edit: src/lib/rate-limit-config.ts
export const RATE_LIMITS = {
  AI_WRITING_SCORE: {
    maxRequests: 20,  // Adjust here
    windowMs: 120 * 1000,  // Or increase window
  },
};
```

### Memory Concerns (High Traffic)
For very high traffic (1000+ concurrent users), consider:
1. Redis-based rate limiting
2. Distributed cache (Memcached)
3. API Gateway (Kong, Tyk)

## Scaling Considerations

### Current Implementation (In-Memory)
- ✅ Perfect for single-server deployments
- ✅ No external dependencies
- ✅ Fast and reliable
- ❌ Resets on server restart
- ❌ Doesn't work across multiple servers

### Future: Redis Implementation
```typescript
// For multi-server setups (future enhancement)
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimitRedis(userId: string, max: number, window: number) {
  const key = `ratelimit:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.ceil(window / 1000));
  }
  
  return {
    limited: count > max,
    remaining: Math.max(0, max - count),
    resetIn: await redis.ttl(key),
  };
}
```

## Cost Analysis

### Without Rate Limiting
- 100 requests/min/teacher × 50 teachers = 5,000 req/min
- 5,000 × 60 × 24 = 7.2M requests/day
- 7.2M × $0.002 = $14,400/day ❌

### With Rate Limiting
- 10 requests/min/teacher × 50 teachers = 500 req/min
- 500 × 60 × 24 = 720K requests/day
- 720K × $0.002 = $1,440/day ✅
- **Savings: $12,960/day = $388,800/month**

## Security Benefits

1. **Prevents Abuse** - Malicious users can't spam API
2. **DOS Protection** - Rate limiting prevents denial of service
3. **Cost Control** - Predictable API expenses
4. **Fair Usage** - All users get equal access
5. **Server Stability** - Controlled load prevents crashes

## Monitoring & Alerting

### What to Monitor
```bash
# Rate limit hits
tail -f logs/app.log | grep "429"

# OpenAI errors
tail -f logs/app.log | grep "OpenAI"

# Server resources
htop
```

### Set Up Alerts
```bash
# Alert if 429s exceed threshold
if [ $(grep -c "429" logs/app.log) -gt 100 ]; then
  echo "High rate limit rejections!" | mail -s "Alert" admin@example.com
fi
```

## Team Communication

### Notify Your Team
```
Subject: AI Rate Limiting Deployed

We've added rate limiting to AI endpoints:
- 10 AI scoring requests per minute per user
- Prevents API abuse and server overload
- Users see friendly error if limit exceeded

No action required, but be aware of the change.

Docs: /docs/AI_RATE_LIMITING.md
```

### User Communication
```
Subject: AI Scoring Update

To ensure stable service for everyone:
- AI scoring is limited to 10 requests/minute
- If you see "Too many requests", wait 1 minute
- Cached scores load instantly (unlimited)

This prevents abuse and keeps the system fast!
```

## Rollback Procedure

If you need to rollback:

```bash
# 1. Git revert
git revert <commit-hash>
git push

# 2. Or temporarily disable
# Edit rate-limit-config.ts:
export const RATE_LIMITS = {
  AI_WRITING_SCORE: {
    maxRequests: 999999,  // Effectively unlimited
    windowMs: 1000,
  },
};

# 3. Restart server
pm2 restart aimentor
```

## Success Metrics

After deployment, verify:
- ✅ 429 responses appearing (rate limiting works)
- ✅ No increase in 500 errors
- ✅ AI scoring still functional
- ✅ OpenAI costs under control
- ✅ No user complaints about normal usage

---

**Questions?** Check `AI_RATE_LIMITING.md` or `README_FINAL.md`

**Issues?** Review server logs: `tail -f logs/app.log`

**Need help?** Contact your DevOps team
