# 🔄 AI Exam Checker Flow Diagram

## Before (No Protection) ❌

```
User clicks "AI Score" 
    ↓
Teacher Frontend
    ↓
Backend API (no limits)
    ↓↓↓↓↓↓↓↓↓↓↓↓ (100s of requests)
    ↓
OpenAI API
    ↓
❌ Rate limit exceeded
❌ Server overloaded
❌ Hetzner blocks IP
```

## After (With Protection) ✅

```
User clicks "AI Score"
    ↓
Teacher Frontend
    ↓
Backend API Route
    ↓
[Rate Limiter Check]
    ├─── ✅ Under limit (< 10/min)
    │        ↓
    │    [Check if already scored]
    │        ├─── ✅ Cached → Return immediately
    │        │
    │        └─── ❌ Not cached
    │                 ↓
    │            [OpenAI Client]
    │                 ↓
    │            - Timeout: 60s
    │            - Retries: 3 times
    │            - Error handling
    │                 ↓
    │            OpenAI API
    │                 ↓
    │            Score returned
    │                 ↓
    │            Save to database
    │                 ↓
    │            Return to user
    │
    └─── ❌ Over limit (≥ 10/min)
             ↓
         HTTP 429 Response
             ↓
         {
           "error": "Too many requests",
           "resetIn": 45,
           "remaining": 0
         }
             ↓
         User sees friendly message:
         "Please wait 45 seconds"
```

## Components Interaction

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  - AI Score Button                                   │
│  - Loading State                                     │
│  - Error Display                                     │
└───────────────────────┬─────────────────────────────┘
                        │ POST /api/attempts/.../ai-score
                        ↓
┌─────────────────────────────────────────────────────┐
│              API Route Handler                       │
│  1. requireAuth() - Check authentication             │
│  2. checkRateLimit() - Verify under limit            │
│  3. Check if already scored (cache)                  │
│  4. Call OpenAI API                                  │
│  5. Save results                                     │
│  6. Return response                                  │
└───────────┬────────────────────────┬────────────────┘
            │                        │
            ↓                        ↓
┌──────────────────────┐  ┌────────────────────────┐
│   Rate Limiter       │  │   OpenAI Client        │
│  - Track requests    │  │  - Timeout: 60s        │
│  - Per user ID       │  │  - Retry: 3 times      │
│  - Window: 60s       │  │  - Error handling      │
│  - Max: 10 req       │  │                        │
└──────────────────────┘  └────────┬───────────────┘
                                   │
                                   ↓
                        ┌────────────────────────┐
                        │   OpenAI API           │
                        │  - gpt-4o-mini         │
                        │  - Scoring logic       │
                        └────────────────────────┘
```

## Rate Limit States

```
┌─────────────────────────────────────────────────────┐
│              Rate Limit Window (60s)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Request 1  ✅  200 OK  (Remaining: 9)               │
│  Request 2  ✅  200 OK  (Remaining: 8)               │
│  Request 3  ✅  200 OK  (Remaining: 7)               │
│  Request 4  ✅  200 OK  (Remaining: 6)               │
│  Request 5  ✅  200 OK  (Remaining: 5)               │
│  Request 6  ✅  200 OK  (Remaining: 4)               │
│  Request 7  ✅  200 OK  (Remaining: 3)               │
│  Request 8  ✅  200 OK  (Remaining: 2)               │
│  Request 9  ✅  200 OK  (Remaining: 1)               │
│  Request 10 ✅  200 OK  (Remaining: 0)               │
│                                                      │
│  ────────────── LIMIT REACHED ──────────────────    │
│                                                      │
│  Request 11 ❌  429 Rate Limited                     │
│  Request 12 ❌  429 Rate Limited                     │
│                                                      │
│  ⏱️  Wait 60 seconds...                              │
│                                                      │
│  ────────────── WINDOW RESET ────────────────       │
│                                                      │
│  Request 13 ✅  200 OK  (Remaining: 9)               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
OpenAI API Call
    ↓
┌─────────────────────────────────┐
│  Try to make request             │
└───────────┬─────────────────────┘
            │
            ├─── ✅ Success (200)
            │        ↓
            │    Return result
            │
            ├─── ❌ OpenAI Rate Limit (429)
            │        ↓
            │    Error: "OpenAI API rate limit exceeded"
            │        ↓
            │    User: "Try again in 5 minutes"
            │
            ├─── ❌ Timeout
            │        ↓
            │    Retry 1 of 3
            │        ↓
            │    Retry 2 of 3
            │        ↓
            │    Retry 3 of 3
            │        ↓
            │    Error: "Request timeout"
            │
            ├─── ❌ Invalid API Key (401)
            │        ↓
            │    Error: "Invalid API key"
            │
            └─── ❌ Service Unavailable (503)
                     ↓
                 Error: "OpenAI unavailable"
```

## Multi-User Scenario

```
Time: 10:00:00

Teacher A                    Teacher B                    Teacher C
    │                            │                            │
    ├─ Request 1  ✅              │                            │
    ├─ Request 2  ✅              │                            │
    ├─ Request 3  ✅              ├─ Request 1  ✅             │
    ├─ Request 4  ✅              ├─ Request 2  ✅             │
    ├─ Request 5  ✅              │                            ├─ Request 1  ✅
    ├─ Request 6  ✅              │                            │
    ├─ Request 7  ✅              │                            │
    ├─ Request 8  ✅              ├─ Request 3  ✅             │
    ├─ Request 9  ✅              │                            │
    ├─ Request 10 ✅              │                            │
    ├─ Request 11 ❌ RATE LIMITED │                            │
    │   (Wait 60s)                │                            │
    │                            ├─ Request 4  ✅             │
    │                            ├─ Request 5  ✅             ├─ Request 2  ✅
    │                            ...                          ...

Each teacher has their own 10 requests/minute limit
```

## Configuration Hierarchy

```
┌────────────────────────────────────────────────┐
│       rate-limit-config.ts                     │
│  ┌──────────────────────────────────────────┐  │
│  │  RATE_LIMITS = {                         │  │
│  │    AI_WRITING_SCORE: {                   │  │
│  │      maxRequests: 10,                    │  │
│  │      windowMs: 60000                     │  │
│  │    }                                     │  │
│  │  }                                       │  │
│  └──────────────────────────────────────────┘  │
└────────────┬───────────────────────────────────┘
             │
             ├──→ writing/ai-score/route.ts
             ├──→ speaking/ai-score/route.ts
             ├──→ speaking/transcribe/route.ts
             └──→ ai-writing-score/route.ts
             
Change in ONE place → All routes updated ✅
```

## Database Impact

```
Before Rate Limiting:
┌─────────────────────────────┐
│  100 AI requests in 1 min   │
│         ↓                   │
│  100 Database writes        │
│         ↓                   │
│  High CPU usage            │
│  Slow queries              │
│  Connection pool exhausted │
└─────────────────────────────┘

After Rate Limiting:
┌─────────────────────────────┐
│  10 AI requests in 1 min    │
│  (90 rejected at API layer) │
│         ↓                   │
│  10 Database writes         │
│         ↓                   │
│  Normal CPU usage          │
│  Fast queries              │
│  Healthy connections       │
└─────────────────────────────┘
```

## Cost Impact

```
Without Rate Limiting:
─────────────────────────────────────────
Teacher spams button: 50 requests in 1 min
× 10 teachers = 500 requests/min
× 60 min/hour = 30,000 requests/hour
× $0.002/request = $60/hour = $1,440/day ❌

With Rate Limiting:
─────────────────────────────────────────
Max: 10 req/min/teacher
× 10 teachers = 100 requests/min
× 60 min/hour = 6,000 requests/hour
× $0.002/request = $12/hour = $288/day ✅
(Plus most requests hit cache = even less!)

Savings: $1,152/day = $34,560/month 💰
```

## Visual Key

```
✅ = Success / Allowed
❌ = Error / Blocked
⏱️ = Waiting
🔄 = Retry
💾 = Cache hit
🤖 = AI processing
🔐 = Rate limited
⚡ = Fast path
🐌 = Slow path
```

---

This diagram shows how the rate limiting protects your system at every level while maintaining a good user experience for legitimate usage.
