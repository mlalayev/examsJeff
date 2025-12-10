# Creator Account Setup (Production)

## Problem
The automatic creator account initialization may not work on some hosting platforms (Vercel, Netlify, etc.) because they don't support Next.js instrumentation hooks in production.

## Quick Setup (3 Steps)

### Step 1: Check Database Status

First, check if your database is connected and working:

```
https://YOUR_DOMAIN.com/api/setup/check
```

This will show you:
- Database connection status
- Number of branches and users
- Creator account status

### Step 2: Initialize Branch (if needed)

If you have 0 branches, create one:

```
https://YOUR_DOMAIN.com/api/setup/init-branch?secret=aimentor-setup-secret-2024
```

### Step 3: Create Creator Account

Now create the creator account:

```
https://YOUR_DOMAIN.com/api/setup/creator?secret=aimentor-setup-secret-2024
```

**Method:** You can use POST request with:
- Browser (just paste URL and it will work)
- curl: `curl -X POST "https://YOUR_DOMAIN.com/api/setup/creator?secret=aimentor-setup-secret-2024"`
- Postman/Thunder Client

## Full Solution (Recommended)

We've created special setup endpoints that you can call once to create the creator account.

### Detailed Steps:

1. **After deploying, call this URL once:**

```
https://YOUR_DOMAIN.com/api/setup/creator?secret=aimentor-setup-secret-2024
```

You can use:
- Your browser (just paste the URL)
- curl: `curl -X POST "https://YOUR_DOMAIN.com/api/setup/creator?secret=aimentor-setup-secret-2024"`
- Postman/Thunder Client

2. **You should see:**



## Solution 2: Database Direct

If the API doesn't work, you can create the account directly in your database:

### Using Prisma Studio:

```bash
npx prisma studio
```

### Using SQL:

```sql
-- First, make sure you have a branch
INSERT INTO "Branch" (id, name, "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'Main Branch', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Then create the creator (replace 'your-branch-id' with actual branch ID)
INSERT INTO "User" (
  id, name, email, "passwordHash", role, approved, "branchId", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'System Creator',
  'creator@creator.com',
  '$2a$10$YourHashedPasswordHere',
  'CREATOR',
  true,
  'your-branch-id',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'CREATOR',
  approved = true;
```

## Security Note

After creating the creator account, you should:
1. Remove or restrict access to `/api/setup/creator` endpoint
2. Change the `SETUP_SECRET` environment variable
3. Or delete the `src/app/api/setup/creator/route.ts` file entirely

## Troubleshooting

### "Invalid setup secret" error
Make sure you're using the correct secret. Check your environment variables or use the default: `aimentor-setup-secret-2024`

### "Cannot register" error  
This is normal. Regular registration is blocked for CREATOR role. Use the setup endpoint instead.

### Account created but can't login

## Environment Variables

Add this to your `.env` file for custom setup secret:

```env
SETUP_SECRET=your-custom-secret-here
```

If not set, defaults to: `aimentor-setup-secret-2024`

