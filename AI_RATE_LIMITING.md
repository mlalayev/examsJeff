# AI Exam Checker - Rate Limiting & Protection

This document explains the rate limiting and protection mechanisms added to prevent API abuse and blocking.

## Problems Solved

### 1. **Rate Limiting Protection**
- **Before**: No rate limits = unlimited API requests could be sent
- **After**: Intelligent rate limiting per user/endpoint

### 2. **OpenAI API Error Handling**
- **Before**: Generic error messages, no retry logic
- **After**: Specific error handling for 429 (rate limit), 401 (auth), 503 (unavailable)

### 3. **Request Timeout Configuration**
- **Before**: Default timeouts (10s on Vercel, 60s self-hosted)
- **After**: Explicit 60-second timeout + OpenAI client timeout

### 4. **Retry Logic**
- **Before**: No retries on transient failures
- **After**: Automatic 3 retries with exponential backoff

## Rate Limits by Endpoint

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| Writing AI Score | 10 requests | 1 minute | Per user |
| Speaking AI Score | 10 requests | 1 minute | Per user |
| Audio Transcribe | 20 requests | 1 minute | Per user (more lenient) |
| Generic AI Writing | 10 requests | 1 minute | Per user |

## Technical Implementation

### Rate Limiter (`src/lib/rate-limiter.ts`)
- In-memory rate limiting (works on single server)
- Tracks requests per user ID
- Automatic cleanup of expired entries
- Returns remaining requests and reset time

### OpenAI Client Updates (`src/lib/openai-client.ts`)
```typescript
- timeout: 60000 (60 seconds)
- maxRetries: 3
- Better error messages for 429, 401, 503 errors
```

### API Route Updates
All AI-related routes now include:
1. `export const maxDuration = 60` - Next.js route timeout
2. Rate limit check before processing
3. Try-catch around OpenAI calls
4. Proper error response with retry information

## Response Headers

When rate limited, you'll receive:
```json
{
  "error": "Too many AI scoring requests",
  "hint": "Please wait 45 seconds before trying again.",
  "remaining": 0,
  "resetIn": 45
}
```

Headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 45
```

## Frontend Integration

Update your frontend to handle rate limits:

```typescript
async function scoreWithAI(attemptId: string) {
  const response = await fetch(`/api/attempts/${attemptId}/writing/ai-score`, {
    method: 'POST',
  });

  if (response.status === 429) {
    const data = await response.json();
    // Show user: "Too many requests. Please wait ${data.resetIn} seconds"
    return;
  }

  if (!response.ok) {
    const data = await response.json();
    // Show error message: data.error
    return;
  }

  // Success
  const result = await response.json();
  // Update UI with result
}
```

## Hetzner Blocking Prevention

To prevent Hetzner from blocking your IP:

1. **Rate limiting is now active** - prevents request floods
2. **Retry logic** - reduces failed request spam
3. **Proper timeouts** - prevents hung connections
4. **Error handling** - graceful failures instead of crashes

## Monitoring

Check your logs for:
- `429` responses - users hitting rate limits
- `OpenAI API rate limit exceeded` - OpenAI quota issues
- `Request timeout` - slow API responses

## Scaling Considerations

Current implementation uses in-memory rate limiting. For multiple servers, consider:

1. **Redis-based rate limiting**
2. **API Gateway** (nginx, Kong, etc.)
3. **CDN rate limiting** (Cloudflare, etc.)

## Testing

Test rate limiting:
```bash
# Send 11 requests rapidly (should see 429 on 11th)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/attempts/xxx/writing/ai-score
done
```

## Environment Variables

Required:
```bash
OPENAI_API_KEY=sk-...
```

Optional (for debugging):
```bash
# Enable verbose OpenAI logging
DEBUG=openai:*
```

## Troubleshooting

### "Too many AI scoring requests"
- Wait for the specified time
- Check if multiple users are clicking rapidly
- Increase rate limits if needed (edit `rate-limiter.ts`)

### "OpenAI API rate limit exceeded"
- Your OpenAI account has hit quota
- Upgrade OpenAI plan or wait for reset
- Check OpenAI dashboard: https://platform.openai.com/usage

### "Request timeout"
- Network issues between your server and OpenAI
- Increase `maxDuration` if needed
- Check server internet connection

### Hetzner Still Blocking
- Verify rate limits are active (check response headers)
- Check firewall logs
- Contact Hetzner support with evidence of rate limiting
- Consider moving OpenAI calls to separate worker/queue

## Additional Recommendations

1. **Queue System**: For high-traffic scenarios, use a job queue (Bull, BullMQ)
2. **Caching**: Cache AI results aggressively (already implemented with `aiScoredAt`)
3. **Webhooks**: For long-running AI tasks, use webhooks instead of long-polling
4. **Monitoring**: Add Sentry/Datadog to track API errors
5. **Load Testing**: Test with tools like k6 or Artillery
